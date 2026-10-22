'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NumberField } from '@/shared/components/ui/number-field'
import { useToast } from '@/shared/components/feedback/toast'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Check, Lock, ScrollText } from 'lucide-react'
import { savePolicies } from '@/features/booking/policy-actions'
import { DEFAULT_POLICIES, type AgencyPolicies } from '@/features/booking/policies'
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
  const { toast } = useToast()

  const num = (f: Field) => Number(values[f])
  const exampleFee = cancellationFee(100, { noticeHours: num('noticeHours'), feePercent: num('feePercent'), feeMinimum: num('feeMinimum') })

  const save = async () => {
    setSaving(true)
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
      toast({ variant: 'success', title: 'Policies saved', description: 'New bookings use these terms; existing orders keep the terms they were booked under.' })
    } else {
      toast({ variant: 'error', title: 'Couldn’t save your policies', description: result.error })
    }
  }

  return (
    <Card className="shadow-raised border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="w-5 h-5" />
          Booking policies
          {!canEdit && <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-fine font-medium text-fg-muted"><Lock className="h-3 w-3" />Elite</span>}
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
              <NumberField
                id={`policy-${field}`}
                decimals={step !== '1'}
                prefix={prefix}
                suffix={suffix}
                value={values[field]}
                disabled={!canEdit || saving}
                onValueChange={v => setValues(vals => ({ ...vals, [field]: v }))}
                className="max-w-56"
              />
              <p className="text-fine text-fg-muted">{help}</p>
            </div>
          ))}
        </div>
        <p className="text-fine text-fg-muted">
          Example: a $100 order cancelled in time gets ${(100 - exampleFee).toFixed(2)} back (fee ${exampleFee.toFixed(2)}).
        </p>
        {canEdit && (
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save policies'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
