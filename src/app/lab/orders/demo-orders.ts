import { addDays, todayIn } from '@/features/booking/booking-rules'

/** Made-up orders for the /lab order pages, shaped like getOrderWithDetails rows. Dates float with today. */
export function demoOrders() {
  const today = todayIn('America/Chicago')
  const at = (days: number) => `${addDays(today, days)}T00:00:00`
  const sign = (id: string, name: string) => ({ id, name, image_url: null, category: 'letter' })
  const lines = (spec: [string, number][]) => spec.map(([name, quantity], i) => ({ sign_id: `s${i}`, quantity, sign: sign(`s${i}`, name) }))
  const base = {
    agency_id: 'lab', subtotal: 95, payment_status: 'paid', documents: [], display_config: null, terms_snapshot: null,
    activities: [], created_at: `${addDays(today, -6)}T15:20:00`, special_instructions: null, delivery_notes: null,
  }
  return [
    {
      ...base, id: 'demo-1', order_number: 'YCE-1042', status: 'pending', customer_name: 'Jordan Baker', customer_email: 'jordan@example.com',
      customer_phone: '(515) 555-0142', event_date: at(3), event_address: '230 Elm Ave, Springfield', delivery_time: 'morning', total: 110, extra_days: 1, extra_day_fee: 15,
      event_type: 'Birthday', order_signs: lines([['Classic Red H', 1], ['Classic Red A', 2], ['Classic Red P', 2], ['Classic Red Y', 2], ['Classic Gold J', 1], ['Balloons', 2]]),
      activities: [{ id: 'a1', action: 'generatePickTicket', status: 'pending', created_at: `${addDays(today, -6)}T15:20:00`, notes: 'Booked online' }],
    },
    {
      ...base, id: 'demo-2', order_number: 'YCE-1039', status: 'processing', customer_name: 'The Whitfield Family', customer_email: 'whitfields@example.com',
      customer_phone: null, event_date: at(0), event_address: '1903 Old Mill Rd, Springfield', delivery_time: 'morning', total: 135, extra_days: 2, extra_day_fee: 40,
      special_instructions: 'Gate code 4471. Please keep signs off the sprinkler heads by the driveway.',
      order_signs: lines([['Classic Gold G', 2], ['Classic Gold R', 1], ['Classic Gold A', 2], ['Classic Gold D', 2], ['Stars', 4]]),
    },
    {
      ...base, id: 'demo-3', order_number: 'YCE-1031', status: 'deployed', customer_name: 'Marcus Lee', customer_email: 'marcus@example.com',
      customer_phone: '515-555-0199', event_date: at(-3), event_address: '88 Birch Ct, Springfield', total: 95,
      order_signs: lines([['Classic Red W', 1], ['Classic Red E', 2], ['Classic Red L', 1], ['Classic Red C', 1], ['Classic Red O', 1], ['Classic Red M', 1]]),
    },
    {
      ...base, id: 'demo-4', order_number: 'YCE-1027', status: 'completed', customer_name: 'Dana Ortiz', customer_email: 'dana@example.com',
      customer_phone: null, event_date: at(-1), event_address: '412 Maple St, Springfield', total: 120, completed_at: `${today}T09:10:00`,
      order_signs: lines([['Classic Red D', 1], ['Classic Red A', 2], ['Classic Red N', 1]]),
    },
    {
      ...base, id: 'demo-5', order_number: 'YCE-1020', status: 'cancelled', customer_name: 'Priya Shah', customer_email: 'priya@example.com',
      customer_phone: null, event_date: at(5), event_address: '7 Cardinal Way, Riverton', total: 95, refund_amount: 75, payment_status: 'partially_refunded',
      cancelled_at: `${addDays(today, -2)}T12:00:00`, order_signs: lines([['Classic Gold P', 1], ['Classic Gold R', 1]]),
    },
  ]
}
