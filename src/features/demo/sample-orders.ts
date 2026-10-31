/**
 * The bookings a freshly reset loaner shows, dated around the day it is
 * lent so "upcoming" is always upcoming (DEMO.md "Template agency"). Pure:
 * the caller inserts the rows. Sign ids follow the seed's 'sign_<asset_key>'.
 */

export interface SampleOrderRow {
  id: string;
  agency_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  event_date: string;
  event_address: string;
  delivery_time: string;
  message: string;
  message_text: string;
  status: 'pending' | 'processing' | 'deployed' | 'completed';
  payment_status: 'paid';
  payment_method: 'card';
  subtotal: number;
  extra_days: number;
  extra_day_fee: number;
  total: number;
  extra_days_before: number;
  extra_days_after: number;
  confirmation_code: string;
  display_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deployed_at: string | null;
  completed_at: string | null;
}

export interface SampleSignRow { id: string; order_id: string; sign_id: string; quantity: number }

interface Spec {
  key: string;
  daysFromToday: number;
  placedDaysAgo: number;
  status: SampleOrderRow['status'];
  customer: string;
  email: string;
  street: string;
  message: string;
  name: string;
  number?: number;
  colorway: string;
  time: string;
}

const SPECS: Spec[] = [
  { key: 'a', daysFromToday: 0, placedDaysAgo: 9, status: 'deployed', customer: 'Jordan Ellis', email: 'jordan.ellis@example.com',
    street: '418 Maple Ridge Dr', message: 'HAPPY BIRTHDAY', name: 'MIA', number: 7, colorway: 'pink', time: 'morning' },
  { key: 'b', daysFromToday: 3, placedDaysAgo: 4, status: 'processing', customer: 'Sam Ortega', email: 'sam.ortega@example.com',
    street: '92 Prairie View Ct', message: 'CONGRATS GRAD', name: 'LEO', colorway: 'blue', time: 'afternoon' },
  { key: 'c', daysFromToday: 6, placedDaysAgo: 1, status: 'pending', customer: 'Priya Natarajan', email: 'priya.n@example.com',
    street: '1550 Oak Hollow Ln', message: 'WELCOME HOME', name: 'AVA', colorway: 'gold', time: 'morning' },
  { key: 'd', daysFromToday: -7, placedDaysAgo: 18, status: 'completed', customer: 'Chris Wagner', email: 'chris.wagner@example.com',
    street: '7 Cedar Bluff Rd', message: 'HAPPY BIRTHDAY', name: 'NOAH', number: 10, colorway: 'green', time: 'morning' },
];

const BASE_PRICE = 95;

/** 'YYYY-MM-DD' plus n days, in plain calendar arithmetic (no time zones involved) */
export function addDays(isoDate: string, n: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Sign lines for a display: one sign per character, counted, in one colorway */
export function signLinesFor(text: string, colorway: string): { assetKey: string; quantity: number }[] {
  const counts = new Map<string, number>();
  for (const ch of text.toUpperCase()) {
    const key = /[A-Z]/.test(ch) ? `letter-${ch.toLowerCase()}-classic-${colorway}`
      : /[0-9]/.test(ch) ? `number-${ch}-classic-${colorway}`
      : null;
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].map(([assetKey, quantity]) => ({ assetKey, quantity }));
}

export function sampleOrders(agencyId: string, today: string, loanerNumber: number): { orders: SampleOrderRow[]; signs: SampleSignRow[] } {
  const orders: SampleOrderRow[] = [];
  const signs: SampleSignRow[] = [];
  for (const [i, s] of SPECS.entries()) {
    const id = `${agencyId}_sample_${s.key}`;
    const eventDate = addDays(today, s.daysFromToday);
    const placed = `${addDays(today, -s.placedDaysAgo)}T15:${String(10 + i * 7).padStart(2, '0')}:00`;
    const display = [s.message, s.name, s.number ?? ''].join(' ').trim();
    orders.push({
      id,
      agency_id: agencyId,
      order_number: `LLS-${loanerNumber}${String(1001 + i)}`,
      customer_name: s.customer,
      customer_email: s.email,
      customer_phone: `(319) 555-01${String(60 + i)}`,
      event_date: `${eventDate}T00:00:00`,
      event_address: JSON.stringify({ street: s.street, city: 'Cedar Rapids', state: 'IA', zip: '52402' }),
      delivery_time: s.time,
      message: s.message,
      message_text: s.message,
      status: s.status,
      payment_status: 'paid',
      payment_method: 'card',
      subtotal: BASE_PRICE,
      extra_days: 0,
      extra_day_fee: 0,
      total: BASE_PRICE,
      extra_days_before: 0,
      extra_days_after: 0,
      confirmation_code: `DEMO${loanerNumber}${s.key.toUpperCase()}${i}`,
      display_config: {
        eventMessage: s.message, recipientName: s.name, eventNumber: s.number ?? null,
        messageStyle: 'Classic', messageColorway: s.colorway, nameStyle: 'Classic', nameColorway: s.colorway, hobbies: [],
      },
      created_at: placed,
      updated_at: placed,
      deployed_at: s.status === 'deployed' || s.status === 'completed' ? `${addDays(eventDate, -1)}T14:00:00` : null,
      completed_at: s.status === 'completed' ? `${addDays(eventDate, 1)}T16:00:00` : null,
    });
    for (const [j, line] of signLinesFor(display, s.colorway).entries()) {
      signs.push({ id: `${id}_line_${j}`, order_id: id, sign_id: `sign_${line.assetKey}`, quantity: line.quantity });
    }
  }
  return { orders, signs };
}
