'use client';

import { useEffect, useState } from 'react';
import { Monitor, Smartphone, Tablet, LogOut } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { Navbar } from '@/components/navbar';
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

function DeviceIcon({ device }: { device: string }) {
  if (device.toLowerCase().includes('mobile')) return <Smartphone className="h-5 w-5" />;
  if (device.toLowerCase().includes('tablet')) return <Tablet className="h-5 w-5" />;
  return <Monitor className="h-5 w-5" />;
}

export default function SessionsPage() {
  const { getAccessToken, logoutAll } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    const token = await getAccessToken();
    if (token) {
      const data = await api.getSessions(token);
      setSessions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSessions();
  }, [getAccessToken]);

  const revokeSession = async (sessionId: string) => {
    const token = await getAccessToken();
    if (token) {
      await api.revokeSession(sessionId, token);
      await loadSessions();
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Active Sessions</h1>
              <p className="text-muted-foreground">
                Manage devices where you&apos;re signed in
              </p>
            </div>
            <Button variant="destructive" onClick={() => logoutAll()}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout All Devices
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No active sessions found
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <DeviceIcon device={session.device} />
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {session.browser} on {session.device}
                            {session.isCurrent && (
                              <Badge variant="success">Current</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {session.os} · {session.location || session.ipAddress}
                          </CardDescription>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeSession(session.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-6 text-sm text-muted-foreground">
                      <span>Last active: {formatRelativeTime(session.lastActive)}</span>
                      <span>Created: {formatDate(session.createdAt)}</span>
                      <span>Expires: {formatDate(session.expiresAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
