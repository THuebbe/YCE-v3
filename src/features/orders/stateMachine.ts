export type OrderStatus = 'pending' | 'processing' | 'deployed' | 'completed' | 'cancelled';

export type OrderAction = 
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
    description: 'Order received and awaiting pick ticket generation'
  },
  processing: {
    actions: ['printOrderSummary', 'markDeployed', 'cancel'],
    nextStates: ['deployed', 'cancelled'],
    description: 'Pick ticket generated, order being prepared for deployment'
  },
  deployed: {
    actions: ['checkInSigns', 'cancel'],
    nextStates: ['completed', 'cancelled'],
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

export function getAvailableActions(status: OrderStatus): OrderAction[] {
  return orderStateMachine[status].actions;
}

export function canTransitionTo(from: OrderStatus, to: OrderStatus): boolean {
  return orderStateMachine[from].nextStates.includes(to);
}

export function getNextStatusForAction(currentStatus: OrderStatus, action: OrderAction): OrderStatus | null {
  const actionToStatusMap: Record<OrderAction, OrderStatus> = {
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
    generatePickTicket: 'Generate Pick Ticket',
    printOrderSummary: 'Print Order Summary',
    markDeployed: 'Mark as Deployed',
    checkInSigns: 'Check In Signs',
    complete: 'Complete Order',
    cancel: 'Cancel Order'
  };
  
  return labels[action];
}