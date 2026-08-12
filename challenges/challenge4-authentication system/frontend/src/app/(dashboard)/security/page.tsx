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
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

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
  const { logoutAll } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<SecurityDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getSecurityDashboard();
      setDashboard(data);
    } catch {
      /* interceptor handles auth errors */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRevokeSession = async (session: Session) => {
    if (session.isCurrent) return;
    setRevokingId(session.id);
    try {
      await api.revokeSession(session.id);
      await load();
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Security Center
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor your account security and manage active sessions
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="sessions">
          <TabsList className="mb-6">
            <TabsTrigger value="sessions" className="gap-2">
              <Monitor className="h-4 w-4" />
              Active Sessions
              {(dashboard?.sessions?.length ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {dashboard?.sessions?.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Login History
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Security Alerts
              {(dashboard?.securityEvents?.filter((e) =>
                ['SUSPICIOUS_LOGIN', 'FAILED_LOGIN', 'ACCOUNT_LOCKED'].includes(
                  e.eventType,
                ),
              )?.length ?? 0) > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {
                    dashboard?.securityEvents?.filter((e) =>
                      ['SUSPICIOUS_LOGIN', 'FAILED_LOGIN', 'ACCOUNT_LOCKED'].includes(
                        e.eventType,
                      ),
                    )?.length
                  }
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Active Sessions ── */}
          <TabsContent value="sessions">
            <Card className="shadow-sm border-muted">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Active Sessions</CardTitle>
                    <CardDescription>
                      Devices currently signed into your account
                    </CardDescription>
                  </div>
                  {(dashboard?.sessions?.length ?? 0) > 1 && (
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
                      Logout All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {(dashboard?.sessions?.length ?? 0) === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No active sessions
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dashboard?.sessions?.map((session) => (
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
                              {session.location || session.ipAddress} · Last
                              active {formatRelativeTime(session.lastActive)}
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

          {/* ── Login History ── */}
          <TabsContent value="history">
            <Card className="shadow-sm border-muted">
              <CardHeader>
                <CardTitle>Login History</CardTitle>
                <CardDescription>
                  Complete record of sign-in attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(dashboard?.loginHistory?.length ?? 0) === 0 ? (
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
                        {dashboard?.loginHistory?.map((login) => (
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

          {/* ── Security Alerts ── */}
          <TabsContent value="alerts">
            <Card className="shadow-sm border-muted">
              <CardHeader>
                <CardTitle>Security Alerts</CardTitle>
                <CardDescription>
                  Suspicious activity and security events on your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(dashboard?.securityEvents?.length ?? 0) === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No security events recorded
                  </p>
                ) : (
                  <div className="space-y-4">
                    {dashboard?.securityEvents?.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium text-sm">
                                {event.eventType.replace(/_/g, ' ')}
                              </span>
                              <Badge
                                variant={
                                  eventSeverity[event.eventType] ?? 'default'
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
        </Tabs>
      )}
    </motion.div>
  );
}
