'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { api, PasswordStrengthResult } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordStrengthMeter } from '@/components/password-strength';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [strengthResult, setStrengthResult] = useState<PasswordStrengthResult | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const passwordValue = watch('newPassword');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  useEffect(() => {
    const checkStrength = async () => {
      if (passwordValue) {
        try {
          const result = await api.checkPasswordStrength(passwordValue);
          setStrengthResult(result);
        } catch {
          // Silent fail
        }
      } else {
        setStrengthResult(null);
      }
    };
    
    const timeoutId = setTimeout(checkStrength, 300);
    return () => clearTimeout(timeoutId);
  }, [passwordValue]);

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!token) return;
    
    try {
      setError(null);
      await api.resetPassword({ token, newPassword: data.newPassword });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
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
            <CardTitle className="text-2xl font-bold tracking-tight">Password reset</CardTitle>
            <CardDescription className="text-base px-4">
              Your password has been successfully reset. You can now log in with your new password.
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
          <CardTitle className="text-2xl font-bold tracking-tight">Reset password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  {...register('newPassword')}
                  className={errors.newPassword ? 'border-destructive focus-visible:ring-destructive pr-10' : 'pr-10'}
                  disabled={isSubmitting || !token}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-destructive">{errors.newPassword.message as string}</p>
              )}
              <PasswordStrengthMeter result={strengthResult} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive pr-10' : 'pr-10'}
                  disabled={isSubmitting || !token}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message as string}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full font-medium" disabled={isSubmitting || !token}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
