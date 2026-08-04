'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';

export function AnnouncementCard() {
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center text-primary"><Megaphone className="h-5 w-5 mr-2" />Announcements</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1"><p className="text-sm font-medium">🚀 Week 3 Challenge</p><p className="text-xs text-muted-foreground">Collab engine released.</p></div>
      </CardContent>
    </Card>
  );
}