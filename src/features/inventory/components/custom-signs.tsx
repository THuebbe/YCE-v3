'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Info, Trash2, Upload } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/components/feedback/toast';
import { deleteCustomSign } from '../actions';
import type { Sign } from '../types';
import { CustomSignUploadForm } from './custom-sign-upload-form';
import { SignLibrary } from './sign-library';

/**
 * Signs the agency bought outside the platform library. They can be stocked
 * like any sign; booking can't place them on a display yet.
 */
export function CustomSigns({ signs, owned }: { signs: Sign[]; owned: Record<string, number> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const remove = async (sign: Sign) => {
    if (!window.confirm(`Delete ${sign.name}? This can't be undone.`)) return;
    const result = await deleteCustomSign(sign.id);
    if (!result.success) toast({ variant: 'error', title: 'Couldn’t delete it', description: result.error });
    else router.refresh();
  };

  return (
    <div className="grid gap-4">
      <p className="flex items-start gap-2 rounded-control bg-notice-soft p-3 text-fine text-notice">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        Custom signs go in your stock like any other, but customers can&apos;t pick them on your booking page yet.
      </p>

      {uploading ? (
        <CustomSignUploadForm onCancel={() => setUploading(false)} onSuccess={() => { setUploading(false); router.refresh(); }} />
      ) : (
        <div>
          <Button onClick={() => setUploading(true)}><Upload className="size-4" aria-hidden /> Upload a sign</Button>
        </div>
      )}

      <SignLibrary
        signs={signs}
        owned={owned}
        searchLabel="Search your custom signs"
        empty={!uploading && <p className="text-fg-muted">No custom signs yet. Upload one you bought somewhere other than the library.</p>}
        extra={sign => (owned[sign.id] ?? 0) === 0 && (
          <Button size="sm" variant="ghost" onClick={() => remove(sign)} className="text-danger">
            <Trash2 className="size-4" aria-hidden /> Delete
          </Button>
        )}
      />
    </div>
  );
}
