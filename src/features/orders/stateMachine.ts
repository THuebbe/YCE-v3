export type OrderStatus = 'pending' | 'processing' | 'deployed' | 'completed' | 'cancelled';

import { hasFeature, type Plan } from '@/features/billing/entitlements';

export type OrderAction = 
  | 'startProcessing'
  | 'generatePickTicket'
  | 'printOrderSummary'
  | 'markDeployed'
  | 'checkInSigns'
  | 'complete'
  | 'cancel';

export interface OrderStateDefinition {
  actions: OrderAction[];
  nextStates: OrderStatus[];
  description: string;
}

export const orderStateMachine: Record<OrderStatus, OrderStateDefinition> = {
  pending: {
    actions: ['generatePickTicket', 'cancel'],
    nextStates: ['processing', 'cancelled'],
    description: 'Order received and awaiting preparation'
  },
  processing: {
    // First action is the main button; the summary PDF is the optional extra
    actions: ['markDeployed', 'printOrderSummary', 'cancel'],
    nextStates: ['deployed', 'cancelled'],
    description: 'Order being prepared for deployment'
  },
  // No cancel once deployed: the signs are in a yard, so the order ends with
  // check-in (which releases its sign hold).
  deployed: {
    actions: ['checkInSigns'],
    nextStates: ['completed'],
    description: 'Signs deployed in the field, awaiting check-in'
  },
  completed: {
    actions: [],
    nextStates: [],
    description: 'Order completed successfully'
  },
  cancelled: {
    actions: [],
    nextStates: [],
    description: 'Order cancelled'
  }
};

/** Essentials has no pick ticket, so it starts an order without one */
export function getAvailableActions(status: OrderStatus, plan: Plan): OrderAction[] {
  const actions = orderStateMachine[status].actions;
  return hasFeature(plan, 'deploymentDocs')
    ? actions
    : actions.map(a => (a === 'generatePickTicket' ? 'startProcessing' : a));
}

export function canTransitionTo(from: OrderStatus, to: OrderStatus): boolean {
  return orderStateMachine[from].nextStates.includes(to);
}

export function getNextStatusForAction(currentStatus: OrderStatus, action: OrderAction): OrderStatus | null {
  const actionToStatusMap: Record<OrderAction, OrderStatus> = {
    startProcessing: 'processing',
    generatePickTicket: 'processing',
    printOrderSummary: 'deployed',
    markDeployed: 'deployed',
    checkInSigns: 'completed',
    complete: 'completed',
    cancel: 'cancelled'
  };

  const nextStatus = actionToStatusMap[action];
  
  if (nextStatus && canTransitionTo(currentStatus, nextStatus)) {
    return nextStatus;
  }
  
  return null;
}

/** What an agency calls each status (DESIGN.md voice: plain words) */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'New',
  processing: 'Getting ready',
  deployed: 'Out',
  completed: 'Done',
  cancelled: 'Cancelled',
};

/** Badge colors: always shown with the label, never color alone */
export const STATUS_TONES: Record<OrderStatus, string> = {
  pending: 'bg-notice-soft text-notice',
  processing: 'bg-caution-soft text-caution',
  deployed: 'bg-brand text-on-brand',
  completed: 'bg-positive-soft text-positive',
  cancelled: 'bg-danger-soft text-danger',
};

export function getActionLabel(action: OrderAction): string {
  const labels: Record<OrderAction, string> = {
    startProcessing: 'Start getting ready',
    generatePickTicket: 'Make pick ticket',
    printOrderSummary: 'Print summary and mark set up',
    markDeployed: 'Mark as set up',
    checkInSigns: 'Check in signs',
    complete: 'Complete order',
    cancel: 'Cancel order'
  };
  
  return labels[action];
}