import { Loader2 } from 'lucide-react'
import { AuthFrame } from '@/features/auth/components/auth-frame'

/** Shows while /routing finds the account (up to a few seconds for a new user) */
export default function RoutingLoading() {
  return (
    <AuthFrame>
      <div role="status" className="grid justify-items-center gap-2 text-center">
        <Loader2 className="size-8 animate-spin text-brand" aria-hidden />
        <p className="font-display text-heading font-semibold">Opening your account…</p>
        <p className="text-fine text-fg-muted">This only takes a moment.</p>
      </div>
    </AuthFrame>
  )
}
