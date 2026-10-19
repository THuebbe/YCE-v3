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
    actions: ['printOrderSummary', 'markDeployed', 'cancel'],
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

export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    deployed: 'bg-purple-100 text-purple-800 border-purple-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  };
  
  return colors[status];
}

export function getActionLabel(action: OrderAction): string {
  const labels: Record<OrderAction, string> = {
    startProcessing: 'Start Processing',
    generatePickTicket: 'Generate Pick Ticket',
    printOrderSummary: 'Print Order Summary',
    markDeployed: 'Mark as Deployed',
    checkInSigns: 'Check In Signs',
    complete: 'Complete Order',
    cancel: 'Cancel Order'
  };
  
  return labels[action];
}