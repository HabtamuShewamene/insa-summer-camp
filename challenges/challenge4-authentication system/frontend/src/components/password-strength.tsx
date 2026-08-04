'use client';

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { api } from '@/lib/api';

interface PasswordStrengthProps {
  password?: string;
}

const strengthLevels = [
  { label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-600' },
  { label: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  { label: 'Strong', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { label: 'Very Strong', color: 'bg-green-500', textColor: 'text-green-600' },
];

const requirements = {
  length: 'At least 8 characters',
  uppercase: 'Uppercase letter',
  lowercase: 'Lowercase letter', 
  number: 'Number',
  special: 'Special character',
};

// Simple local check when API isn't available
function checkPasswordBasic(pwd: string) {
  const checks = {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pwd),
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const score = Math.max(0, passed - 1);
  
  return {
    score: Math.min(score, 4),
    checks,
    feedback: []
  };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!password) {
      setResult(null);
      return;
    }

    // Debounce the API call
    const timer = setTimeout(async () => {
      try {
        const data = await api.checkPasswordStrength(password);
        setResult(data);
      } catch {
        // Fall back to local check
        setResult(checkPasswordBasic(password));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [password]);

  if (!password || !result) return null;

  const level = strengthLevels[result.score] || strengthLevels[0];
  const barCount = result.score + 1;

  return (
    <div className="space-y-3 mt-2">
      {/* Strength bars */}
      <div className="space-y-1">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < barCount ? level.color : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className={`text-xs font-medium ${level.textColor}`}>
          {level.label}
        </p>
      </div>

      {/* Requirements */}
      <ul className="space-y-1">
        {Object.entries(result.checks).map(([key, passed]) => (
          <li key={key} className="flex items-center gap-2 text-xs">
            {passed ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-gray-400" />
            )}
            <span className={passed ? 'text-green-700' : 'text-gray-500'}>
              {requirements[key as keyof typeof requirements]}
            </span>
          </li>
        ))}
      </ul>

      {/* Feedback */}
      {result.feedback && result.feedback.length > 0 && result.score < 3 && (
        <p className="text-xs text-gray-500 italic">
          {result.feedback[0]}
        </p>
      )}
    </div>
  );
}
