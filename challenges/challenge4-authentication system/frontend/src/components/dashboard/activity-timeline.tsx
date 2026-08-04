'use client';
import { FileText, UserPlus, MessageSquare, History, LogIn } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';

export function ActivityTimeline() {
  const activities = [
    { id: 1, title: 'Document Created', desc: 'You created "Sprint Planning"', time: '2 hours ago', icon: FileText, color: 'text-blue-500' },
    { id: 2, title: 'Document Shared', desc: 'Sarah shared "Weekly Notes"', time: '3 hours ago', icon: UserPlus, color: 'text-green-500' },
    { id: 3, title: 'New Login', desc: 'Login from new device', time: '2 days ago', icon: LogIn, color: 'text-red-500' },
  ];
  return (
    <Card className="h-full">
      <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-6">
            {activities.map((activity, i) => (
              <motion.div key={activity.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="relative flex gap-4">
                {i !== activities.length - 1 && <div className="absolute left-4 top-10 bottom-0 w-[2px] -ml-px bg-border" />}
                <div className="relative flex-shrink-0 z-10"><div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border-2 border-background shadow-sm"><activity.icon className={`h-4 w-4 ${activity.color}`} /></div></div>
                <div className="flex-1 space-y-1 pb-1"><p className="text-sm font-medium leading-none">{activity.title}</p><p className="text-sm text-muted-foreground">{activity.desc}</p><p className="text-xs text-muted-foreground pt-1">{activity.time}</p></div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}