'use client';

import { Check, X } from 'lucide-react';
import { PasswordStrengthResult } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function PasswordStrengthMeter({ result }: { result: PasswordStrengthResult | null }) {
  if (!result) return null;

  const getScoreColor = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return 'bg-destructive';
      case 2:
        return 'bg-yellow-500';
      case 3:
      case 4:
        return 'bg-green-500';
      default:
        return 'bg-muted';
    }
  };

  const getScoreLabel = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      default:
        return 'Too short';
    }
  };

  return (
    <div className="mt-2 space-y-3">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground font-medium">Password strength</span>
        <span
          className={cn('font-semibold transition-colors duration-300', {
            'text-destructive': result.score <= 1,
            'text-yellow-500': result.score === 2,
            'text-green-500': result.score >= 3,
          })}
        >
          {getScoreLabel(result.score)}
        </span>
      </div>

      <div className="flex gap-1 h-1.5">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            className={cn(
              'h-full flex-1 rounded-full transition-colors duration-300',
              index < (result.score === 0 && result.label !== 'empty' ? 1 : result.score)
                ? getScoreColor(result.score)
                : 'bg-muted'
            )}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: index * 0.1 }}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-2">
        <RequirementItem met={result.checks.length} text="8+ characters" />
        <RequirementItem met={result.checks.uppercase} text="Uppercase letter" />
        <RequirementItem met={result.checks.lowercase} text="Lowercase letter" />
        <RequirementItem met={result.checks.number} text="Number" />
        <RequirementItem met={result.checks.special} text="Special character" />
      </div>
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {met ? (
        <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
      ) : (
        <X className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
      )}
      <span className={cn('truncate transition-colors', met && 'text-foreground')}>
        {text}
      </span>
    </div>
  );
}
