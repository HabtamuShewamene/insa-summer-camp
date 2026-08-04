'use client';
import { FileText, Users, Clock, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

export function StatsGrid() {
  const stats = [
    { title: 'My Documents', value: '12', icon: FileText, trend: '+2 this week' },
    { title: 'Shared With Me', value: '8', icon: Share2, trend: '3 updated recently' },
    { title: 'Recently Opened', value: '4', icon: Clock, trend: 'Last 24 hours' },
    { title: 'Collaborators', value: '15', icon: Users, trend: '+5 new' },
  ];
  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {stats.map((stat, i) => (
        <motion.div key={i} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}