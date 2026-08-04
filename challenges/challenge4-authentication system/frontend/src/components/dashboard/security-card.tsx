'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, MonitorSmartphone, MailCheck, Globe } from 'lucide-react';
import Link from 'next/link';

export function SecurityCard() {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg flex items-center"><Shield className="h-5 w-5 mr-2 text-primary" />Security</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" className="w-full" asChild><Link href="/security">Manage Security</Link></Button>
      </CardContent>
    </Card>
  );
}