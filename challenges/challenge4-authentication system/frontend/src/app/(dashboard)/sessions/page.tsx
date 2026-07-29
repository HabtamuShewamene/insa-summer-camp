'use client';

import { useEffect, useState, useCallback } from 'react';
import { Monitor, Smartphone, Tablet, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, Session } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime, formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

function DeviceIcon({ device }: { device: string }) {
  const d = device.toLowerCase();
  if (d.includes('mobile')) return <Smartphone className="h-5 w-5" />;
  if (d.includes('tablet')) return <Tablet className="h-5 w-5" />;
  return <Monitor className="h-5 w-5" />;
}

export default function SessionsPage() {
  const { logoutAll } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const data = await api.getSessions();
      setSessions(data);
    } catch {
      /* interceptor handles auth errors */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const revokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await api.revokeSession(sessionId);
      await loadSessions();
    } finally {
      setRevokingId(null);
    }
  };

  const handleLogoutAll = async () => {
    setLogoutAllLoading(true);
    try {
      await logoutAll();
      router.push('/login');
    } finally {
      setLogoutAllLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Sessions</h1>
          <p className="text-muted-foreground mt-2">
            Manage devices where you&apos;re signed in
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={handleLogoutAll}
          disabled={logoutAllLoading}
        >
          {logoutAllLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4 mr-2" />
          )}
          Logout All Devices
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sessions.length === 0 ? (
        <Card className="shadow-sm border-muted">
          <CardContent className="py-12 text-center text-muted-foreground">
            No active sessions found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id} className="shadow-sm border-muted">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <DeviceIcon device={session.device} />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {session.browser} on {session.device}
                        {session.isCurrent && (
                          <Badge variant="success">Current</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {session.os ? `${session.os} · ` : ''}
                        {session.location || session.ipAddress}
                      </CardDescription>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeSession(session.id)}
                      disabled={revokingId === session.id}
                    >
                      {revokingId === session.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        'Revoke'
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <span>
                    Last active: {formatRelativeTime(session.lastActive)}
                  </span>
                  <span>Created: {formatDate(session.createdAt)}</span>
                  <span>Expires: {formatDate(session.expiresAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
