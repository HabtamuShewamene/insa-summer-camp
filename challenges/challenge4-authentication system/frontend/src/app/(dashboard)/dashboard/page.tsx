'use client';

import { useAuth } from '@/lib/auth-context';
import { WelcomeHero } from '@/components/dashboard/welcome-hero';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { DocumentSections } from '@/components/dashboard/document-sections';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';
import { RightSidebar } from '@/components/dashboard/right-sidebar';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuth();
  
  if (!user) return null;

  const isFirstLogin = false;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <WelcomeHero firstName={user.name?.split(' ')[0] || 'User'} isFirstLogin={isFirstLogin} />
      
      <StatsGrid />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <DocumentSections />
          <ActivityTimeline />
        </div>
        
        <div className="xl:col-span-1">
          <RightSidebar />
        </div>
      </div>
    </motion.div>
  );
}
