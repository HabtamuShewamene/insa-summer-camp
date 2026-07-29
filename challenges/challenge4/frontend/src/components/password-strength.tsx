'use client';

import { useEffect, useState, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { api, PasswordStrengthResult } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
}

const scoreConfig = [
  { label: 'Very Weak', color: 'bg-red-500',    textColor: 'text-red-600',    bars: 1 },
  { label: 'Weak',      color: 'bg-orange-500', textColor: 'text-orange-600', bars: 2 },
  { label: 'Fair',      color: 'bg-yellow-500', textColor: 'text-yellow-600', bars: 3 },
  { label: 'Strong',    color: 'bg-blue-500',   textColor: 'text-blue-600',   bars: 4 },
  { label: 'Very Strong', color: 'bg-green-500', textColor: 'text-green-600', bars: 5 },
];

const checkLabels: Record<keyof PasswordStrengthResult['checks'], string> = {
  length:    'At least 8 characters',
  uppercase: 'Uppercase letter (A–Z)',
  lowercase: 'Lowercase letter (a–z)',
  number:    'Number (0–9)',
  special:   'Special character (!@#$…)',
};

// Client-side fallback when API is unavailable
function localStrength(pwd: string): PasswordStrengthResult {
  const checks = {
    length:    pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number:    /[0-9]/.test(pwd),
    special:   /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pwd),
  };
  const passing = Object.values(checks).filter(Boolean).length;
  const score = Math.max(0, passing - 1) as 0 | 1 | 2 | 3 | 4;
  return {
    score,
    label: scoreConfig[score].label.toLowerCase().replace(' ', '-'),
    feedback: [],
    checks,
  };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {  const [result, setResult] = useState<PasswordStrengthResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!password) {
      setResult(null);
      return;
    }

    timerRef.current = setTimeout(async () => {
      try {
        const data = await api.checkPasswordStrength(password);
        setResult(data);
      } catch {
        setResult(localStrength(password));
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [password]);

  if (!password || !result) return null;

  const config = scoreConfig[result.score];

  return (
    <div className="space-y-3 mt-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                i < config.bars ? config.color : 'bg-muted',
              )}
            />
          ))}
        </div>
        <p className={cn('text-xs font-medium', config.textColor)}>
          {config.label}
        </p>
      </div>

      {/* Requirements checklist */}
      <ul className="space-y-1">
        {(
          Object.entries(result.checks) as [keyof typeof result.checks, boolean][]
        ).map(([key, passing]) => (
          <li key={key} className="flex items-center gap-2 text-xs">
            {passing ? (
              <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className={passing ? 'text-green-700' : 'text-muted-foreground'}>
              {checkLabels[key]}
            </span>
          </li>
        ))}
      </ul>

      {/* Extra feedback tip from zxcvbn */}
      {result.feedback.length > 0 && result.score < 3 && (
        <p className="text-xs text-muted-foreground italic">{result.feedback[0]}</p>
      )}
    </div>
  );
}

// ── PasswordStrengthMeter ─────────────────────────────────────────────────────
// Accepts an already-fetched PasswordStrengthResult (used by register/settings
// pages that manage their own debounced API call via react-hook-form).

interface PasswordStrengthMeterProps {
  result: PasswordStrengthResult | null;
}

export function PasswordStrengthMeter({ result }: PasswordStrengthMeterProps) {
  if (!result) return null;

  const config = scoreConfig[result.score];

  return (
    <div className="space-y-3 mt-2">
      <div className="space-y-1">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                i < config.bars ? config.color : 'bg-muted',
              )}
            />
          ))}
        </div>
        <p className={cn('text-xs font-medium', config.textColor)}>
          {config.label}
        </p>
      </div>

      <ul className="space-y-1">
        {(
          Object.entries(result.checks) as [keyof typeof result.checks, boolean][]
        ).map(([key, passing]) => (
          <li key={key} className="flex items-center gap-2 text-xs">
            {passing ? (
              <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className={passing ? 'text-green-700' : 'text-muted-foreground'}>
              {checkLabels[key]}
            </span>
          </li>
        ))}
      </ul>

      {result.feedback.length > 0 && result.score < 3 && (
        <p className="text-xs text-muted-foreground italic">{result.feedback[0]}</p>
      )}
    </div>
  );
}
