'use client';

import { useEffect, useState, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import { api, PasswordStrengthResult } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
}

const scoreConfig = [
  { label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-600', bars: 1 },
  { label: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-600', bars: 2 },
  { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600', bars: 3 },
  { label: 'Strong', color: 'bg-blue-500', textColor: 'text-blue-600', bars: 4 },
  { label: 'Very Strong', color: 'bg-green-500', textColor: 'text-green-600', bars: 5 },
];

const checkLabels: Record<keyof PasswordStrengthResult['checks'], string> = {
  length: 'At least 8 characters',
  uppercase: 'Uppercase letter (A–Z)',
  lowercase: 'Lowercase letter (a–z)',
  number: 'Number (0–9)',
  special: 'Special character (!@#$…)',
};

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const [result, setResult] = useState<PasswordStrengthResult | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const evaluate = useCallback((pwd: string) => {
    if (!pwd) {
      setResult(null);
      return;
    }
    api.checkPasswordStrength(pwd).then(setResult).catch(() => {
      // Fallback: compute checks client-side if API unavailable
      const checks = {
        length: pwd.length >= 8,
        uppercase: /[A-Z]/.test(pwd),
        lowercase: /[a-z]/.test(pwd),
        number: /[0-9]/.test(pwd),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pwd),
      };
      const passing = Object.values(checks).filter(Boolean).length;
      const score = Math.max(0, passing - 1) as 0 | 1 | 2 | 3 | 4;
      setResult({ score, label: scoreConfig[score].label.toLowerCase().replace(' ', '-'), feedback: [], checks });
    });
  }, []);

  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => evaluate(password), 300);
    setDebounceTimer(timer);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  if (!password) return null;

  const config = result ? scoreConfig[result.score] : null;

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
                result && i < (config?.bars ?? 0)
                  ? config?.color
                  : 'bg-muted',
              )}
            />
          ))}
        </div>
        {config && (
          <p className={cn('text-xs font-medium', config.textColor)}>
            {config.label}
          </p>
        )}
      </div>

      {/* Requirements checklist */}
      {result && (
        <ul className="space-y-1">
          {(Object.entries(result.checks) as [keyof typeof result.checks, boolean][]).map(
            ([key, passing]) => (
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
            ),
          )}
        </ul>
      )}

      {/* Extra zxcvbn feedback */}
      {result?.feedback && result.feedback.length > 0 && result.score < 3 && (
        <p className="text-xs text-muted-foreground italic">
          {result.feedback[0]}
        </p>
      )}
    </div>
  );
}
