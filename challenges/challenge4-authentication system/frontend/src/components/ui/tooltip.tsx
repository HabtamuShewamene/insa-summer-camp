'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const TooltipContext = React.createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null);

const Tooltip = ({ children, delayDuration: _delayDuration, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLSpanElement> & { delayDuration?: number }>) => {
  const [open, setOpen] = React.useState(false);

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <span className="relative inline-flex" {...props}>{children}</span>
    </TooltipContext.Provider>
  );
};

const TooltipTrigger = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { asChild?: boolean }>(
  ({ asChild, children, onMouseEnter, onMouseLeave, onFocus, onBlur, ...props }, ref) => {
    const context = React.useContext(TooltipContext);

    const handleEnter = (event: React.MouseEvent<HTMLElement>) => {
      context?.setOpen(true);
      onMouseEnter?.(event);
    };

    const handleLeave = (event: React.MouseEvent<HTMLElement>) => {
      context?.setOpen(false);
      onMouseLeave?.(event);
    };

    const handleFocus = (event: React.FocusEvent<HTMLElement>) => {
      context?.setOpen(true);
      onFocus?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLElement>) => {
      context?.setOpen(false);
      onBlur?.(event);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        ...props,
        onMouseEnter: handleEnter,
        onMouseLeave: handleLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
      });
    }

    return (
      <span
        ref={ref as React.RefObject<HTMLSpanElement>}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      >
        {children}
      </span>
    );
  },
);

TooltipTrigger.displayName = 'TooltipTrigger';

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: 'top' | 'bottom' | 'left' | 'right'; sideOffset?: number }
>(({ className, children, side = 'bottom', sideOffset = 4, ...props }, ref) => {
    const context = React.useContext(TooltipContext);

    if (!context?.open) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="tooltip"
        className={cn(
          side === 'bottom' ? 'absolute left-1/2 top-full mt-2 -translate-x-1/2' : '',
          side === 'top' ? 'absolute bottom-full left-1/2 mb-2 -translate-x-1/2' : '',
          side === 'left' ? 'absolute right-full top-1/2 mr-2 -translate-y-1/2' : '',
          side === 'right' ? 'absolute left-full top-1/2 ml-2 -translate-y-1/2' : '',
          'z-50 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground shadow-sm',
          className,
        )}
        style={{ marginTop: side === 'bottom' ? sideOffset : undefined, ...(props.style || {}) }}
        {...props}
      >
        {children}
      </div>
    );
  },
);

TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
