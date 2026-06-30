import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useAuthStore((s) => s.signIn);
  const signInAsGuest = useAuthStore((s) => s.signInAsGuest);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const redirectTo = (location.state as { from?: string })?.from ?? '/';

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    setFormError(null);
    const result = await signIn(values.email, values.password);
    setIsSubmitting(false);
    if (!result.success) { setFormError(result.error ?? 'Something went wrong. Try again.'); return; }
    navigate(redirectTo, { replace: true });
  }

  async function onGuest() {
    setIsGuestLoading(true);
    setFormError(null);
    const result = await signInAsGuest();
    setIsGuestLoading(false);
    if (!result.success) { setFormError(result.error ?? 'Something went wrong. Try again.'); return; }
    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Subtle radial glow behind the card */}
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, hsl(252 87% 67% / 0.15) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-[360px]">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">Riftbound</span>
            <span className="text-3xl font-light tracking-tight text-muted-foreground">for friends</span>
          </div>
        </div>

        {/* Card */}
        <div className="card-surface p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="crew@example.com"
                className="input"
                {...register('email')}
              />
              {errors.email && <p className="err">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="input"
                {...register('password')}
              />
              {errors.password && <p className="err">{errors.password.message}</p>}
            </div>

            {formError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3">
                <p className="text-sm text-destructive">{formError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isGuestLoading}
              className="mt-2 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold
                text-primary-foreground shadow-primary transition-all
                hover:brightness-110 active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          {/* Guest button */}
          <button
            onClick={onGuest}
            disabled={isSubmitting || isGuestLoading}
            className={cn(
              'mt-4 w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold transition-all',
              'text-muted-foreground hover:text-foreground hover:border-border/80',
              'active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isGuestLoading ? 'Continuing…' : 'Continue as Guest'}
          </button>
        </div>
      </div>
    </div>
  );
}
