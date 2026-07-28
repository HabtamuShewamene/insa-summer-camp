'use client';

import { useEffect, useState } from 'react';
import {
  Shield,
  Monitor,
  AlertTriangle,
  CheckCircle,
  KeyRound,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { Navbar } from '@/components/navbar';
import { useAuth } from '@/lib/auth-context';
import { api, SecurityDashboard } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { ChangePasswordModal } from '@/components/change-password-modal';

export default function DashboardPage() {
  const { user, getAccessToken } = useAuth();
  const [dashboard, setDashboard] = useState<SecurityDashboard | null>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const token = await getAccessToken();
      if (token) {
        const data = await api.getSecurityDashboard(token);
        setDashboard(data);
      }
    }
    load();
  }, [getAccessToken]);

  const activeSessions = dashboard?.sessions.length ?? 0;
  const recentAlerts =
    dashboard?.securityEvents.filter((e) =>
      [
        'SUSPICIOUS_LOGIN',
        'FAILED_LOGIN',
        'ACCOUNT_LOCKED',
        'NEW_DEVICE_LOGIN',
      ].includes(e.eventType),
    ).length ?? 0;

  const isLocalAccount = user?.provider === 'LOCAL';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user?.name}</p>
            </div>
            {isLocalAccount && (
              <Button
                variant="outline"
                onClick={() => setChangePasswordOpen(true)}
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Sessions
                </CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSessions}</div>
                <p className="text-xs text-muted-foreground">
                  Devices currently signed in
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Security Alerts
                </CardTitle>
                <AlertTriangle
                  className={`h-4 w-4 ${
                    recentAlerts > 0 ? 'text-destructive' : 'text-muted-foreground'
                  }`}
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentAlerts}</div>
                <p className="text-xs text-muted-foreground">
                  Recent security events
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Account Status
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {user?.provider?.toLowerCase()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user?.emailVerified ? 'Email verified' : 'Email not verified'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent data */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Recent Security Events
                </CardTitle>
                <CardDescription>Latest activity on your account</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard?.securityEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events yet</p>
                ) : (
                  dashboard?.securityEvents.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start justify-between py-3 border-b last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {event.eventType.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.description}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                        {formatDate(event.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Logins</CardTitle>
                <CardDescription>Your login history</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard?.loginHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No login history
                  </p>
                ) : (
                  dashboard?.loginHistory.slice(0, 5).map((login) => (
                    <div
                      key={login.id}
                      className="flex items-start justify-between py-3 border-b last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {login.browser} on {login.device}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {login.location || login.ipAddress}
                        </p>
                      </div>
                      <Badge
                        variant={
                          login.status === 'SUCCESS' ? 'success' : 'destructive'
                        }
                      >
                        {login.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </ProtectedRoute>
  );
}
