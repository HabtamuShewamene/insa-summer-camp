'use client';

import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Mail, ShieldCheck, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user.name.split(' ')[0]}! Here's an overview of your account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
            <UserCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{user.name}</div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {user.email}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              Active
              <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-500 hover:bg-green-500/10 border-green-500/20">
                Verified
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Member since {new Date(user.createdAt || Date.now()).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Provider</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{user.provider.toLowerCase()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Authentication method
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm border-muted">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest account activity and security events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Mail className="h-8 w-8 mb-4 opacity-20" />
              <p>Go to the Security tab to see your full activity log.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
