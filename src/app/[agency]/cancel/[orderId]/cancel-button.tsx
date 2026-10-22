'use client'

import { useState } from 'react'
import { cancelBookingAsCustomer } from '@/features/orders/customer-actions'
import { Button } from '@/shared/components/ui/button'

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
    return <p className="rounded-card bg-positive-soft p-4 font-semibold text-positive" role="status">{message}</p>
  }
  return (
    <div className="grid gap-3">
      <Button type="button" variant="error" size="lg" onClick={cancel} loading={state === 'working'} disabled={state === 'working'} className="w-full">
        {state === 'working' ? 'Cancelling…' : refund > 0 ? 'Yes, cancel and refund me' : 'Yes, cancel my booking'}
      </Button>
      {message && <p className="text-fine text-danger" role="alert">{message}</p>}
    </div>
  )
}
