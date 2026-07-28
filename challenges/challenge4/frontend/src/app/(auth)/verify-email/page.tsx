'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Missing verification token.');
      return;
    }

    const verify = async () => {
      try {
        await api.verifyEmail(token);
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to verify email. The token may have expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-muted shadow-lg rounded-2xl overflow-hidden text-center">
        <CardHeader className="space-y-4 pb-6 pt-10">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center">
            {status === 'loading' && (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <div className="bg-green-500/10 w-full h-full rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            )}
            {status === 'error' && (
              <div className="bg-destructive/10 w-full h-full rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            )}
          </div>
          
          <CardTitle className="text-2xl font-bold tracking-tight">
            {status === 'loading' && 'Verifying your email'}
            {status === 'success' && 'Email verified'}
            {status === 'error' && 'Verification failed'}
          </CardTitle>
          
          <CardDescription className="text-base px-4">
            {status === 'loading' && 'Please wait while we verify your email address...'}
            {status === 'success' && 'Your email address has been successfully verified. You can now access all features.'}
            {status === 'error' && errorMessage}
          </CardDescription>
        </CardHeader>
        
        <CardFooter className="flex justify-center border-t p-6 bg-muted/20">
          {status === 'loading' ? (
            <p className="text-sm text-muted-foreground">This should only take a moment.</p>
          ) : (
            <Button onClick={() => router.push('/login')} className="w-full">
              {status === 'success' ? 'Continue to login' : 'Back to login'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
