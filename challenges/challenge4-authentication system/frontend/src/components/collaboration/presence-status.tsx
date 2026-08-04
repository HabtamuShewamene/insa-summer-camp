'use client';

import { cn } from '@/lib/utils';
import { Circle } from 'lucide-react';

export type UserStatus = 'online' | 'idle' | 'offline';

interface PresenceStatusProps {
  status: UserStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function PresenceStatus({
  status,
  showLabel = false,
  size = 'sm',
  className,
}: PresenceStatusProps) {
  const iconSizes = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
  };

  const statusConfig = {
    online: {
      color: 'text-emerald-500',
      label: 'Online',
      fillClass: 'fill-current',
    },
    idle: {
      color: 'text-amber-500',
      label: 'Idle',
      fillClass: 'fill-current',
    },
    offline: {
      color: 'text-gray-400',
      label: 'Offline',
      fillClass: '',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Circle
        className={cn(iconSizes[size], config.color, config.fillClass)}
      />
      {showLabel && (
        <span className={cn('text-xs font-medium', config.color)}>
          {config.label}
        </span>
      )}
    </div>
  );
}
