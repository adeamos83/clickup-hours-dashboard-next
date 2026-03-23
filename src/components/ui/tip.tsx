'use client';

import { Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

/**
 * Inline info icon that shows a tooltip on hover.
 * Used next to card titles and metric labels.
 */
export function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
        <Info className="h-3.5 w-3.5" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px]">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Wraps column header text so hovering shows a tooltip. No icon.
 */
export function ColTip({ label, text }: { label: string; text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger className="cursor-help border-b border-dashed border-muted-foreground/30">
        {label}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px]">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
