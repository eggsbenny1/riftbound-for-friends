import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Player } from '@/types';

const ACCENT_COLORS = [
  '#6366f1', '#ef4444', '#3b82f6', '#22c55e',
  '#f97316', '#a855f7', '#eab308', '#ec4899',
];

const schema = z.object({
  username: z.string().min(2, 'Min 2 chars').max(30).regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, underscores only'),
  display_name: z.string().min(1, 'Required').max(50),
  bio: z.string().max(200).optional(),
  color: z.string(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  existing?: Player;
  onSaved: (player: Player) => void;
  onCancel?: () => void;
};

export default function PlayerForm({ existing, onSaved, onCancel }: Props) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(existing?.avatar_url ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: existing?.username ?? '',
      display_name: existing?.display_name ?? '',
      bio: existing?.bio ?? '',
      color: existing?.color ?? '#6366f1',
    },
  });

  const selectedColor = watch('color');

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    setError(null);

    let avatarUrl = existing?.avatar_url ?? null;

    // Upload avatar if changed
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const path = `${values.username}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('player-avatars')
        .upload(path, avatarFile, { upsert: true });
      if (uploadErr) { setError(`Avatar upload failed: ${uploadErr.message}`); setSaving(false); return; }
      const { data: urlData } = supabase.storage.from('player-avatars').getPublicUrl(path);
      avatarUrl = urlData.publicUrl;
    }

    const payload = {
      username: values.username,
      display_name: values.display_name,
      bio: values.bio || null,
      color: values.color,
      avatar_url: avatarUrl,
    };

    if (existing) {
      const { data, error: updateErr } = await supabase
        .from('players').update(payload).eq('id', existing.id).select().single();
      if (updateErr || !data) { setError(updateErr?.message ?? 'Update failed'); setSaving(false); return; }
      onSaved(data as Player);
    } else {
      const { data, error: insertErr } = await supabase
        .from('players').insert({ ...payload, is_active: true }).select().single();
      if (insertErr || !data) { setError(insertErr?.message ?? 'Create failed'); setSaving(false); return; }
      onSaved(data as Player);
    }

    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div
          className="h-16 w-16 rounded-full overflow-hidden border-2 flex items-center justify-center text-xl font-bold"
          style={{ borderColor: selectedColor, background: avatarPreview ? 'transparent' : selectedColor }}
        >
          {avatarPreview
            ? <img src={avatarPreview} className="h-full w-full object-cover" alt="" />
            : <span className="text-white">{watch('display_name')?.[0]?.toUpperCase() ?? '?'}</span>}
        </div>
        <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">
          <Upload size={14} />
          Upload avatar
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Username</label>
          <input {...register('username')} placeholder="jinx_main" className="input w-full" disabled={!!existing} />
          {errors.username && <p className="err">{errors.username.message}</p>}
        </div>
        <div>
          <label className="label">Display Name</label>
          <input {...register('display_name')} placeholder="Benson" className="input w-full" />
          {errors.display_name && <p className="err">{errors.display_name.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Bio (optional)</label>
        <textarea {...register('bio')} rows={2} placeholder="A bit about this player…" className="input w-full resize-none" />
      </div>

      {/* Accent color */}
      <div>
        <label className="label">Accent Colour</label>
        <div className="flex gap-2 mt-1 flex-wrap">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setValue('color', c)}
              className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                background: c,
                borderColor: selectedColor === c ? 'white' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving}
          className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {saving ? 'Saving…' : existing ? 'Update Player' : 'Create Player'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
