'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TypingUser {
  userId: string;
  name: string;
  isTyping: boolean;
}

interface TypingIndicatorProps {
  typingUsers?: TypingUser[];
  className?: string;
}

export function TypingIndicator({ typingUsers = [], className }: TypingIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typingUsers.length > 0) {
      setVisible(true);
    } else {
      // Fade out after a short delay
      const timeout = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [typingUsers]);

  if (!visible || typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    const names = typingUsers.map((u) => u.name);
    
    if (names.length === 1) {
      return `${names[0]} is typing...`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else if (names.length === 3) {
      return `${names[0]}, ${names[1]}, and ${names[2]} are typing...`;
    } else {
      return `${names[0]}, ${names[1]}, and ${names.length - 2} others are typing...`;
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-2',
        className
      )}
    >
      <span>{getTypingText()}</span>
      <div className="flex gap-1">
        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>
          ●
        </span>
        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>
          ●
        </span>
        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>
          ●
        </span>
      </div>
    </div>
  );
}
