'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PasswordStrength } from '@/components/password-strength';
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[a-z]/, 'Must contain lowercase')
      .regex(/[0-9]/, 'Must contain number')
      .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

// Inner component â€” safe to call useSearchParams() here because it's
// wrapped in <Suspense> by the outer default export below.
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(
    token ? null : 'Invalid or missing reset token. Please request a new link.',
  );
  const [isSuccess, setIsSuccess] = useState(false);
  

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const passwordValue = watch('newPassword');

  const onSubmit = async (data: FormValues) => {
    try {
      setError(null);
      await api.resetPassword({ token: token as string, newPassword: data.newPassword });
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to reset password. Please try again.',
      );
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-muted shadow-lg rounded-2xl overflow-hidden text-center">
          <CardHeader className="space-y-4 pb-6 pt-10">
            <div className="mx-auto bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Password reset
            </CardTitle>
            <CardDescription className="text-base px-4">
              Your password has been successfully reset. You can now log in with
              your new password.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center border-t p-6 bg-muted/20">
            <Button onClick={() => router.push('/login')} className="w-full">
              Go to login
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-muted shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Reset password
          </CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {error}
                {(error.includes('Invalid') || error.includes('missing')) && (
                  <div className="mt-2">
                    <Link
                      href="/forgot-password"
                      className="font-medium underline"
                    >
                      Request a new link â†’
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPw ? 'text' : 'password'}
                  {...register('newPassword')}
                  className={
                    errors.newPassword
                      ? 'border-destructive focus-visible:ring-destructive pr-10'
                      : 'pr-10'
                  }
                  disabled={isSubmitting || !token}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-destructive">
                  {errors.newPassword?.message as string}
                </p>
              )}
              <PasswordStrength password={passwordValue} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className={
                    errors.confirmPassword
                      ? 'border-destructive focus-visible:ring-destructive pr-10'
                      : 'pr-10'
                  }
                  disabled={isSubmitting || !token}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={
                    showConfirm ? 'Hide password' : 'Show password'
                  }
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword?.message as string}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full font-medium"
              disabled={isSubmitting || !token}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resettingâ€¦
                </>
              ) : (
                'Reset password'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4 bg-muted/20">
          <Link
            href="/login"
            className="flex items-center text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// Suspense is required whenever useSearchParams() is used in a
// Next.js App Router page â€” without it the build throws a hard error.
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}


