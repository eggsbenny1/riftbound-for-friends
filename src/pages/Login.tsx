import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useAuthStore((s) => s.signIn);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // After login, return the user to wherever they were headed
  // (e.g. they tapped a deep link to /score before being signed in).
  const redirectTo = (location.state as { from?: string })?.from ?? '/';

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    setFormError(null);

    const result = await signIn(values.email, values.password);

    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.error ?? 'Something went wrong. Try again.');
      return;
    }

    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Riftbound Crew Tracker</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with the shared crew login
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="crew@example.com"
              className="w-full rounded-md border border-input bg-secondary px-3 py-2.5
                text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-md border border-input bg-secondary px-3 py-2.5
                text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {formError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{formError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold
              text-primary-foreground transition-opacity hover:opacity-90
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Don't have the shared login? Ask whoever set up the crew tracker.
        </p>
      </div>
    </div>
  );
}
