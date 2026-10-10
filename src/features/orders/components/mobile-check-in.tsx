'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { ArrowLeft, Package, User, Calendar, MapPin } from 'lucide-react';
import { checkInOrder } from '../actions';
import { countOrderSigns, formatAddress, formatCurrency, formatEventDate, getOrderSignLines } from '../client-utils';
import { useToast } from '@/shared/components/feedback/toast';
import { useAgencySlug } from '@/lib/navigation';

interface MobileCheckInProps {
  order: any;
}

interface LineCount {
  signId: string;
  damaged: number;
  missing: number;
  notes: string;
}

/**
 * Pickup check-in: every sign line starts as all returned in good shape; the
 * agency marks how many came back damaged or are missing. Damaged and missing
 * signs leave stock for good (decided 2026-10-10); completing the check-in
 * releases the order's sign hold.
 */
export function MobileCheckIn({ order }: MobileCheckInProps) {
  const lines = getOrderSignLines(order);
  const [counts, setCounts] = useState<LineCount[]>(
    lines.map(line => ({ signId: line.signId, damaged: 0, missing: 0, notes: '' }))
  );
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const agencySlug = useAgencySlug();

  const update = (signId: string, change: Partial<LineCount>) =>
    setCounts(prev => prev.map(c => (c.signId === signId ? { ...c, ...change } : c)));

  const totalSigns = countOrderSigns(order);
  const damaged = counts.reduce((sum, c) => sum + c.damaged, 0);
  const missing = counts.reduce((sum, c) => sum + c.missing, 0);
  const good = totalSigns - damaged - missing;

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      const result = await checkInOrder({
        orderId: order.id,
        lines: lines.map(line => {
          const c = counts.find(x => x.signId === line.signId)!;
          return {
            signId: line.signId,
            good: line.quantity - c.damaged - c.missing,
            damaged: c.damaged,
            missing: c.missing,
            notes: c.notes,
          };
        }),
        notes: additionalNotes,
      });
      if (!result.success) {
        toast({ title: 'Check-in failed', description: result.error, variant: 'error' });
        return;
      }
      toast({
        title: 'Signs checked in',
        description: result.removedFromStock
          ? `Order completed. ${result.removedFromStock} damaged/missing sign${result.removedFromStock === 1 ? '' : 's'} removed from your inventory.`
          : 'Order completed. All signs are back in stock.',
        variant: 'success',
      });
      router.push(`/${agencySlug}/orders/${order.id}`);
      router.refresh();
    } finally {
      setIsProcessing(false);
    }
  };

  if (order.status !== 'deployed') {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-gray-700">
          Order #{order.order_number} is {order.status}. Only deployed orders can be checked in.
        </p>
        <Button variant="secondary" onClick={() => router.push(`/${agencySlug}/orders/${order.id}`)}>
          Back to order
        </Button>
      </div>
    );
  }

  const Stepper = ({ label, value, max, onChange, tone }: {
    label: string; value: number; max: number; onChange: (n: number) => void; tone: string;
  }) => (
    <div className="flex items-center justify-between">
      <span className={`text-sm font-medium ${tone}`}>{label}</span>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          aria-label={`Fewer ${label.toLowerCase()}`}
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
          className="w-9 h-9 rounded-full bg-gray-100 disabled:opacity-40"
        >
          -
        </button>
        <span className="w-6 text-center">{value}</span>
        <button
          type="button"
          aria-label={`More ${label.toLowerCase()}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-9 h-9 rounded-full bg-gray-100 disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" onClick={() => router.back()} className="p-2" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">Check In Signs</h1>
            <p className="text-sm text-gray-600">Order #{order.order_number}</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Order Information</h2>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">Deployed</Badge>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-900">{order.customer_name}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-900">{formatEventDate(new Date(order.event_date))}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-900">{formatAddress(order.event_address)}</span>
              </div>
              <div className="flex items-center">
                <Package className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-900">{totalSigns} signs • {formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{good}</div>
              <div className="text-sm text-gray-600">Good</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{damaged}</div>
              <div className="text-sm text-gray-600">Damaged</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{missing}</div>
              <div className="text-sm text-gray-600">Missing</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Damaged and missing signs are removed from your inventory.
          </p>
        </Card>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Signs</h3>
          {lines.length === 0 && (
            <p className="text-sm text-gray-600">No signs are recorded for this order.</p>
          )}
          {lines.map(line => {
            const c = counts.find(x => x.signId === line.signId)!;
            const returned = line.quantity - c.damaged - c.missing;
            return (
              <Card key={line.signId} className="p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  {line.sign?.image_url && (
                    <img src={line.sign.image_url} alt={line.sign.name} className="w-12 h-12 object-contain rounded bg-white" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{line.sign?.name ?? line.signId}</h4>
                    <p className="text-sm text-gray-600">
                      {line.quantity} out • {returned} back in good shape
                    </p>
                  </div>
                </div>
                <Stepper
                  label="Damaged" value={c.damaged} tone="text-orange-700"
                  max={line.quantity - c.missing}
                  onChange={n => update(line.signId, { damaged: n })}
                />
                <Stepper
                  label="Missing" value={c.missing} tone="text-red-700"
                  max={line.quantity - c.damaged}
                  onChange={n => update(line.signId, { missing: n })}
                />
                {(c.damaged > 0 || c.missing > 0) && (
                  <textarea
                    placeholder="What happened? (kept with the order)"
                    value={c.notes}
                    onChange={e => update(line.signId, { notes: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md resize-none text-sm"
                    rows={2}
                  />
                )}
              </Card>
            );
          })}
        </div>

        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Additional Notes</h3>
          <textarea
            placeholder="Any additional notes about the pickup..."
            value={additionalNotes}
            onChange={e => setAdditionalNotes(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md resize-none"
            rows={3}
          />
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <Button
          onClick={handleSubmit}
          disabled={isProcessing || lines.length === 0}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-medium"
        >
          {isProcessing ? 'Processing...' : 'Complete Check-In'}
        </Button>
      </div>
    </div>
  );
}
