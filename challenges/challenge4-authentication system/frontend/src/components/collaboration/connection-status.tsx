'use client';

import { useCollaboration } from '@/lib/collaboration-context';
import { Circle, Loader2, WifiOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
  const { status, isConnected } = useCollaboration();

  const statusConfig = {
    connecting: {
      icon: Loader2,
      text: 'Connecting...',
      className: 'text-muted-foreground',
      iconClassName: 'animate-spin',
    },
    connected: {
      icon: Circle,
      text: 'Connected',
      className: 'text-emerald-600 dark:text-emerald-500',
      iconClassName: 'fill-current',
    },
    reconnecting: {
      icon: Loader2,
      text: 'Reconnecting...',
      className: 'text-amber-600 dark:text-amber-500',
      iconClassName: 'animate-spin',
    },
    disconnected: {
      icon: WifiOff,
      text: 'Disconnected',
      className: 'text-gray-500 dark:text-gray-400',
      iconClassName: '',
    },
    offline: {
      icon: WifiOff,
      text: 'Offline',
      className: 'text-gray-500 dark:text-gray-400',
      iconClassName: '',
    },
    error: {
      icon: AlertCircle,
      text: 'Sync Failed',
      className: 'text-red-600 dark:text-red-500',
      iconClassName: '',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Icon className={cn('h-3 w-3', config.className, config.iconClassName)} />
      <span className={cn('text-xs font-medium', config.className)}>
        {config.text}
      </span>
    </div>
  );
}
