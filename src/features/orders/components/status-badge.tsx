import { cn } from '@/lib/utils';
import { STATUS_LABELS, STATUS_TONES, type OrderStatus } from '../stateMachine';

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const known = status in STATUS_LABELS ? (status as OrderStatus) : null;
  return (
    <span className={cn('inline-flex items-center rounded-control px-2 py-0.5 text-fine font-bold', known ? STATUS_TONES[known] : 'bg-surface-sunken text-fg', className)}>
      {known ? STATUS_LABELS[known] : status}
    </span>
  );
}
