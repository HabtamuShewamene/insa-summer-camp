'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export type UserStatus = 'online' | 'idle' | 'offline';

interface CollaboratorAvatarProps {
  name: string;
  avatar?: string;
  color: string;
  status?: UserStatus;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
}

export function CollaboratorAvatar({
  name,
  avatar,
  color,
  status = 'online',
  size = 'md',
  showStatus = true,
  className,
}: CollaboratorAvatarProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
  };

  const statusSizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    idle: 'bg-amber-500',
    offline: 'bg-gray-400',
  };

  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar className={cn(sizeClasses[size], 'border-2 border-background')}>
        {avatar ? (
          <AvatarImage src={avatar} alt={name} />
        ) : null}
        <AvatarFallback
          style={{
            backgroundColor: color,
            color: '#ffffff',
          }}
          className="font-semibold"
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      
      {showStatus && status !== 'offline' && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-background',
            statusSizeClasses[size],
            statusColors[status]
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}
