'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Check, Lock, ScrollText } from 'lucide-react'
import { savePolicies } from '@/features/booking/policy-actions'
import { DEFAULT_POLICIES, POLICY_LIMITS, type AgencyPolicies } from '@/features/booking/policies'
import { cancellationFee } from '@/features/booking/terms'

interface PoliciesCardProps {
  /** The agency's stored policies (defaults filling gaps) */
  policies: AgencyPolicies
  canEdit: boolean // Elite
  billingHref: string
}

type Field = 'noticeHours' | 'feePercent' | 'feeMinimum' | 'lateFee' | 'damageFeePerSign'

const FIELDS: { field: Field; label: string; help: string; prefix?: string; suffix?: string; step: string }[] = [
  { field: 'noticeHours', label: 'Cancellation notice', help: 'Cancel at least this long before delivery for a refund. 0 = any time before delivery.', suffix: 'hours', step: '1' },
  { field: 'feePercent', label: 'Cancellation fee', help: 'Kept from the refund.', suffix: '% of the order', step: '0.5' },
  { field: 'feeMinimum', label: 'Minimum cancellation fee', help: 'The fee is the % or this, whichever is more.', prefix: '$', step: '1' },
  { field: 'lateFee', label: 'Late pickup fee', help: 'Per extra day when signs can\'t be collected on time.', prefix: '$', suffix: 'per day', step: '1' },
  { field: 'damageFeePerSign', label: 'Damage fee', help: 'Per damaged or missing sign.', prefix: '$', suffix: 'per sign', step: '1' },
]

function flatten(p: AgencyPolicies): Record<Field, string> {
  return {
    noticeHours: String(p.cancellation.noticeHours),
    feePercent: String(p.cancellation.feePercent),
    feeMinimum: String(p.cancellation.feeMinimum),
    lateFee: String(p.lateFee),
    damageFeePerSign: String(p.damageFeePerSign),
  }
}

export function PoliciesCard({ policies, canEdit, billingHref }: PoliciesCardProps) {
  const shown = canEdit ? policies : DEFAULT_POLICIES
  const [values, setValues] = useState(flatten(shown))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const num = (f: Field) => Number(values[f])
  const exampleFee = cancellationFee(100, { noticeHours: num('noticeHours'), feePercent: num('feePercent'), feeMinimum: num('feeMinimum') })

  const save = async () => {
    setSaving(true)
    setMessage(null)
    const result = await savePolicies({
      noticeHours: num('noticeHours'),
      feePercent: num('feePercent'),
      feeMinimum: num('feeMinimum'),
      lateFee: num('lateFee'),
      damageFeePerSign: num('damageFeePerSign'),
    })
    setSaving(false)
    if (result.success) {
      setValues(flatten(result.policies))
      setMessage({ ok: true, text: 'Saved. New bookings use these terms; existing orders keep the terms they were booked under.' })
    } else {
      setMessage({ ok: false, text: result.error })
    }
  }

  return (
    <Card className="shadow-sm border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="w-5 h-5" />
          Booking policies
          {!canEdit && <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600"><Lock className="h-3 w-3" />Elite</span>}
        </CardTitle>
        <CardDescription>
          The cancellation, late and damage fees your customers agree to when they book.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!canEdit && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Your bookings use the standard policies below. <Link href={billingHref} className="font-medium underline">Upgrade to Elite</Link> to set your own.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {FIELDS.map(({ field, label, help, prefix, suffix, step }) => (
            <div key={field} className="space-y-1.5">
              <Label htmlFor={`policy-${field}`}>{label}</Label>
              <div className="flex items-center gap-2">
                {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
                <Input
                  id={`policy-${field}`}
                  type="number"
                  inputMode="decimal"
                  min={POLICY_LIMITS[field].min}
                  max={POLICY_LIMITS[field].max}
                  step={step}
                  value={values[field]}
                  disabled={!canEdit || saving}
                  onChange={e => setValues(v => ({ ...v, [field]: e.target.value }))}
                  className="max-w-32"
                />
                {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
              </div>
              <p className="text-xs text-muted-foreground">{help}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Example: a $100 order cancelled in time gets ${(100 - exampleFee).toFixed(2)} back (fee ${exampleFee.toFixed(2)}).
        </p>
        {message && (
          <Alert variant={message.ok ? 'default' : 'destructive'}>
            {message.ok && <Check className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
        {canEdit && (
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save policies'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
