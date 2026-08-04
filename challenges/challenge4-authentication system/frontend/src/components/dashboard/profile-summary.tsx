'use client';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Mail, User, ShieldCheck } from 'lucide-react';

export function ProfileSummary() {
  const { user } = useAuth();
  if (!user) return null;
  const initials = user.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase() : 'U';
  return (
    <Card className="overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-primary/40 to-primary/10" />
      <CardContent className="relative pt-0 pb-6">
        <div className="flex justify-center -mt-12 mb-4">
          <Avatar className="h-24 w-24 border-4 border-background shadow-md"><AvatarFallback className="text-2xl bg-muted text-primary">{initials}</AvatarFallback></Avatar>
        </div>
        <div className="text-center space-y-1 mb-6">
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-sm text-muted-foreground flex items-center justify-center"><Mail className="h-3 w-3 mr-1" />{user.email}</p>
          <div className="flex justify-center mt-2"><Badge variant="secondary" className="font-normal">Member</Badge></div>
        </div>
      </CardContent>
    </Card>
  );
}