'use client'

import React, { useEffect, useState } from 'react'
import { Receipt, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NumberField } from '@/shared/components/ui/number-field'
import { Label } from '@/shared/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import { useToast } from '@/shared/components/feedback/toast'
import { calculateBookingAmounts, formatTaxRate, MAX_SALES_TAX_RATE } from '@/features/booking/pricing'

export interface SalesTaxAnswer {
  rate: number
  included: boolean
}

interface SalesTaxCardProps {
  agencyId: string
  /** null: not answered yet (booking page stays closed) */
  initial: SalesTaxAnswer | null
  /** For the worked example */
  basePrice: number
  onSaved?: () => void
}

const money = (n: number) => `$${n.toFixed(2)}`

/**
 * The sales tax question (owner, 2026-11-07): every agency answers before
 * its booking page opens, either "I don't charge it" or one flat rate,
 * added on top of the prices or already included in them. The agency sets
 * the rate and files the tax; we add it to bookings and receipts.
 */
export function SalesTaxCard({ agencyId, initial, basePrice, onSaved }: SalesTaxCardProps) {
  const [charges, setCharges] = useState<'yes' | 'no' | ''>(initial ? (initial.rate > 0 ? 'yes' : 'no') : '')
  const [rateText, setRateText] = useState(initial && initial.rate > 0 ? String(initial.rate) : '')
  const [included, setIncluded] = useState(initial?.included ?? false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [answered, setAnswered] = useState(!!initial)
  const { toast } = useToast()

  // Follow the loaded answer (the settings load after first paint)
  useEffect(() => {
    setCharges(initial ? (initial.rate > 0 ? 'yes' : 'no') : '')
    setRateText(initial && initial.rate > 0 ? String(initial.rate) : '')
    setIncluded(initial?.included ?? false)
    setAnswered(!!initial)
  }, [initial])

  const rate = Number(rateText)
  const rateOk = charges === 'yes' && rateText !== '' && Number.isFinite(rate) && rate > 0 && rate <= MAX_SALES_TAX_RATE
  const example = rateOk && basePrice > 0
    ? calculateBookingAmounts({ basePrice, extraDayPrice: 0, lateFee: 0, salesTaxRate: rate, taxIncluded: included })
    : null

  const save = async () => {
    setError(null)
    if (!charges) { setError('Choose one.'); return }
    if (charges === 'yes' && !rateOk) { setError(`Enter your rate, above 0 and up to ${MAX_SALES_TAX_RATE}%.`); return }
    setSaving(true)
    try {
      const response = await fetch(`/api/agency/financial-settings?agencyId=${agencyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salesTax: { rate: charges === 'yes' ? rate : 0, included: charges === 'yes' && included } }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to save sales tax')
      setAnswered(true)
      toast({ variant: 'success', title: 'Sales tax saved', description: 'New bookings use it right away.' })
      onSaved?.()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save sales tax'
      setError(message)
      toast({ variant: 'error', title: 'Couldn’t save sales tax', description: message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card id="sales-tax" className="shadow-raised border-0 scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Sales tax
        </CardTitle>
        <CardDescription>
          {answered
            ? 'You set the rate and file the tax. We add it to each booking and show it on receipts.'
            : 'Answer this before your booking page opens. You set the rate and file the tax; we add it to each booking and show it on receipts.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <RadioGroup value={charges} onValueChange={v => { setCharges(v as 'yes' | 'no'); setError(null) }} name="charges-sales-tax" aria-label="Do you charge sales tax?">
          <label className="flex min-h-11 cursor-pointer items-center gap-3">
            <RadioGroupItem value="no" />
            <span>I don’t charge sales tax</span>
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-3">
            <RadioGroupItem value="yes" />
            <span>I charge sales tax</span>
          </label>
        </RadioGroup>

        {charges === 'yes' && (
          <div className="space-y-5 border-l-2 border-line pl-4">
            <div className="max-w-48 space-y-2">
              <Label htmlFor="sales-tax-rate">Your rate</Label>
              <NumberField
                id="sales-tax-rate"
                decimals={3}
                suffix="%"
                value={rateText}
                onValueChange={v => { setRateText(v); setError(null) }}
                placeholder="8.25"
              />
            </div>

            <RadioGroup value={included ? 'included' : 'on-top'} onValueChange={v => setIncluded(v === 'included')} name="sales-tax-included" aria-label="How the tax shows on your prices">
              <label className="flex min-h-11 cursor-pointer items-center gap-3">
                <RadioGroupItem value="on-top" />
                <span>Add it on top of my prices</span>
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-3">
                <RadioGroupItem value="included" />
                <span>My prices already include it</span>
              </label>
            </RadioGroup>

            {example && (
              <p className="rounded-card bg-surface-sunken p-3 text-fine">
                {included
                  ? <>Customers see {money(example.total)}*, with “*Sales tax included in the price” in small print. You see the split on each order: {money(example.tax)} tax ({formatTaxRate(rate)}) and {money(example.subtotal)} yours.</>
                  : <>A {money(basePrice)} rental costs the customer {money(basePrice)} + {money(example.tax)} tax ({formatTaxRate(rate)}) = {money(example.total)}.</>}
              </p>
            )}

            <p className="text-fine text-fg-muted">
              One rate for every booking. If you deliver to places with different rates, ask your tax advisor which one to use.
            </p>
          </div>
        )}

        {error && <p className="text-fine text-danger" role="alert">{error}</p>}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button onClick={save} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving…' : 'Save sales tax'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
