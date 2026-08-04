'use client';

import { PermissionLevel } from '@/lib/sharing.service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Edit3, MessageSquare, Eye } from 'lucide-react';

interface PermissionSelectorProps {
  value: PermissionLevel;
  onChange: (value: PermissionLevel) => void;
  disabled?: boolean;
}

export function PermissionSelector({ value, onChange, disabled }: PermissionSelectorProps) {
  const options: { level: PermissionLevel; label: string; icon: any; description: string }[] = [
    { level: 'EDITOR', label: 'Editor', icon: Edit3, description: 'Can edit content & add comments' },
    { level: 'COMMENTER', label: 'Commenter', icon: MessageSquare, description: 'Can view & add comments' },
    { level: 'VIEWER', label: 'Viewer', icon: Eye, description: 'Can view document only' },
  ];

  const selected = options.find((o) => o.level === value) || options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-2 font-normal justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium">
            <selected.icon className="h-3.5 w-3.5" />
            {selected.label}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.level}
            onClick={() => onChange(opt.level)}
            className="flex flex-col items-start p-2 gap-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-2 font-medium text-xs">
              <opt.icon className="h-3.5 w-3.5 text-muted-foreground" />
              {opt.label}
            </div>
            <span className="text-[11px] text-muted-foreground pl-5.5">{opt.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
