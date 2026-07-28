'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Shield,
  AlertTriangle,
  History,
  Monitor,
  LogOut,
  Loader2,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { Navbar } from '@/components/navbar';
import { useAuth } from '@/lib/auth-context';
import { api, SecurityDashboard, Session } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, formatRelativeTime } from '@/lib/utils';

const eventSeverity: Record<
  string,
  'destructive' | 'secondary' | 'success' | 'default'
> = {
  SUSPICIOUS_LOGIN: 'destructive',
  FAILED_LOGIN: 'destructive',
  ACCOUNT_LOCKED: 'destructive',
  NEW_DEVICE_LOGIN: 'secondary',
  PASSWORD_CHANGED: 'success',
  SESSION_REVOKED: 'default',
  LOGOUT_ALL_DEVICES: 'default',
  GOOGLE_ACCOUNT_LINKED: 'success',
  REGISTRATION: 'success',
};

function eventLabel(type: string): string {
  if (['SUSPICIOUS_LOGIN', 'FAILED_LOGIN', 'ACCOUNT_LOCKED'].includes(type))
    return 'Alert';
  if (type === 'NEW_DEVICE_LOGIN') return 'Warning';
  return 'Info';
}

export default function SecurityPage() {
  const { getAccessToken, logoutAll } = useAuth();
  const [dashboard, setDashboard] = useState<SecurityDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  const load = useCallback(async () => {
    const token = await getAccessToken();
    if (token) {
      const data = await api.getSecurityDashboard(token);
      setDashboard(data);
    }
    setLoading(false);
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRevokeSession = async (session: Session) => {
    if (session.isCurrent) return;
    setRevokingId(session.id);
    try {
      const token = await getAccessToken();
      if (token) {
        await api.revokeSession(session.id, token);
        await load();
      }
    } finally {
      setRevokingId(null);
    }
  };

  const handleLogoutAll = async () => {
    setLogoutAllLoading(true);
    try {
      await logoutAll();
    } finally {
      setLogoutAllLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Security Center
            </h1>
            <p className="text-muted-foreground">
              Monitor your account security and login activity
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="alerts">
              <TabsList className="mb-6">
                <TabsTrigger value="alerts" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Security Alerts
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  Login History
                </TabsTrigger>
                <TabsTrigger value="sessions" className="gap-2">
                  <Monitor className="h-4 w-4" />
                  Active Sessions
                  {(dashboard?.sessions.length ?? 0) > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {dashboard?.sessions.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* ── Security Alerts ── */}
              <TabsContent value="alerts">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Alerts</CardTitle>
                    <CardDescription>
                      Suspicious activity and security events on your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(dashboard?.securityEvents.length ?? 0) === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No security events recorded
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {dashboard?.securityEvents.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-start justify-between p-4 rounded-lg border"
                          >
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">
                                    {event.eventType.replace(/_/g, ' ')}
                                  </span>
                                  <Badge
                                    variant={
                                      eventSeverity[event.eventType] ??
                                      'default'
                                    }
                                  >
                                    {eventLabel(event.eventType)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {event.description}
                                </p>
                                {event.ipAddress && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    IP: {event.ipAddress}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                              {formatDate(event.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Login History ── */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Login History</CardTitle>
                    <CardDescription>
                      Complete record of sign-in attempts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(dashboard?.loginHistory.length ?? 0) === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No login history yet
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left">
                              <th className="pb-3 font-medium">Date</th>
                              <th className="pb-3 font-medium">Device</th>
                              <th className="pb-3 font-medium">Location</th>
                              <th className="pb-3 font-medium">Status</th>
                              <th className="pb-3 font-medium">Risk</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboard?.loginHistory.map((login) => (
                              <tr key={login.id} className="border-b last:border-0">
                                <td className="py-3 whitespace-nowrap">
                                  {formatDate(login.createdAt)}
                                </td>
                                <td className="py-3">
                                  {login.browser} / {login.device}
                                </td>
                                <td className="py-3">
                                  {login.location || login.ipAddress}
                                </td>
                                <td className="py-3">
                                  <Badge
                                    variant={
                                      login.status === 'SUCCESS'
                                        ? 'success'
                                        : 'destructive'
                                    }
                                  >
                                    {login.status}
                                  </Badge>
                                </td>
                                <td className="py-3">
                                  {login.riskScore > 0 ? (
                                    <Badge
                                      variant={
                                        login.riskScore >= 70
                                          ? 'destructive'
                                          : 'secondary'
                                      }
                                    >
                                      {login.riskScore}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">
                                      Low
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Active Sessions ── */}
              <TabsContent value="sessions">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>Active Sessions</CardTitle>
                        <CardDescription>
                          Devices currently signed into your account
                        </CardDescription>
                      </div>
                      {(dashboard?.sessions.length ?? 0) > 1 && (
                        <Button
                          variant="destructive"
                          size="sm"
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
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(dashboard?.sessions.length ?? 0) === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No active sessions
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {dashboard?.sessions.map((session) => (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-4 rounded-lg border"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <Monitor className="h-4 w-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm flex items-center gap-2 flex-wrap">
                                  {session.browser} on {session.device}
                                  {session.isCurrent && (
                                    <Badge variant="success">Current</Badge>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {session.location || session.ipAddress} ·{' '}
                                  Last active {formatRelativeTime(session.lastActive)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Created {formatDate(session.createdAt)}
                                </p>
                              </div>
                            </div>
                            {!session.isCurrent && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="ml-4 shrink-0"
                                onClick={() => handleRevokeSession(session)}
                                disabled={revokingId === session.id}
                              >
                                {revokingId === session.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <LogOut className="h-3.5 w-3.5 mr-1" />
                                    Revoke
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
