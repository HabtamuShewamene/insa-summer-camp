'use client';
import { ProfileSummary } from './profile-summary';
import { SecurityCard } from './security-card';
import { AnnouncementCard } from './announcement-card';

export function RightSidebar() {
  return (
    <div className="space-y-6">
      <ProfileSummary />
      <AnnouncementCard />
      <SecurityCard />
    </div>
  );
}