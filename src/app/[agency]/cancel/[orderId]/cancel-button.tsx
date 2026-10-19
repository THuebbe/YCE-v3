'use client'

import { useState } from 'react'
import { cancelBookingAsCustomer } from '@/features/orders/customer-actions'

export function CancelBookingButton({ agencySlug, orderId, token, refund }: { agencySlug: string; orderId: string; token: string; refund: number }) {
  const [state, setState] = useState<'idle' | 'working' | 'done'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const cancel = async () => {
    setState('working')
    setMessage(null)
    const result = await cancelBookingAsCustomer({ agencySlug, orderId, token })
    if (result.success) {
      setState('done')
      setMessage(result.refund > 0
        ? `Your booking is cancelled. ${result.refunded ? `$${result.refund.toFixed(2)} is on its way to your card (usually 5-10 business days).` : `The agency will refund $${result.refund.toFixed(2)}.`} We've emailed you a confirmation.`
        : 'Your booking is cancelled. We’ve emailed you a confirmation.')
    } else {
      setState('idle')
      setMessage(result.error)
    }
  }

  if (state === 'done') {
    return <p className="mt-5 rounded-lg bg-green-50 p-4 text-green-800" role="status">{message}</p>
  }
  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={cancel}
        disabled={state === 'working'}
        className="w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        {state === 'working' ? 'Cancelling…' : refund > 0 ? 'Yes, cancel and refund me' : 'Yes, cancel my booking'}
      </button>
      {message && <p className="mt-3 text-sm text-red-700" role="alert">{message}</p>}
    </div>
  )
}
