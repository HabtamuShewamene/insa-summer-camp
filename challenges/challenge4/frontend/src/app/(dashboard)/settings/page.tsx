'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api, PasswordStrengthResult } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordStrengthMeter } from '@/components/password-strength';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
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

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [strengthResult, setStrengthResult] = useState<PasswordStrengthResult | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPasswordValue = watch('newPassword');

  useState(() => {
    let timeoutId: NodeJS.Timeout;
    if (newPasswordValue) {
      timeoutId = setTimeout(async () => {
        try {
          const result = await api.checkPasswordStrength(newPasswordValue);
          setStrengthResult(result);
        } catch {
          // Silent fail
        }
      }, 300);
    } else {
      setStrengthResult(null);
    }
    return () => clearTimeout(timeoutId);
  });

  const onSubmit = async (data: ChangePasswordValues) => {
    try {
      setError(null);
      setSuccess(null);
      await api.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess('Password changed successfully.');
      reset();
      setStrengthResult(null);
    } catch (err: any) {
      setError(err.message || 'Failed to change password.');
    }
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-4xl"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="shadow-sm border-muted">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              Your personal information associated with your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue={user.name} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" defaultValue={user.email} disabled />
              <p className="text-[0.8rem] text-muted-foreground">
                Your email address is managed by your identity provider ({user.provider}).
              </p>
            </div>
          </CardContent>
        </Card>

        {user.provider === 'LOCAL' && (
          <Card className="shadow-sm border-muted">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-500/15 text-green-500 text-sm p-3 rounded-md">
                    {success}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative max-w-md">
                    <Input
                      id="currentPassword"
                      type={showCurrent ? 'text' : 'password'}
                      {...register('currentPassword')}
                      className={errors.currentPassword ? 'border-destructive' : ''}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-xs text-destructive">{errors.currentPassword.message as string}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative max-w-md">
                    <Input
                      id="newPassword"
                      type={showNew ? 'text' : 'password'}
                      {...register('newPassword')}
                      className={errors.newPassword ? 'border-destructive' : ''}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-xs text-destructive">{errors.newPassword.message as string}</p>
                  )}
                  <div className="max-w-md">
                    <PasswordStrengthMeter result={strengthResult} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative max-w-md">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      className={errors.confirmPassword ? 'border-destructive' : ''}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword.message as string}</p>
                  )}
                </div>

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
