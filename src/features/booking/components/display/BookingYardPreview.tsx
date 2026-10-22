'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { YardScene } from '@/features/yard-scene/YardScene';
import { loadManifest, type SignAsset } from '../../services/sign-assets';
import type { LayoutCalculation } from '../../types';
import { describeLayout, sceneRowsFromLayout } from './scene-from-layout';

/**
 * A booking's display on the lawn: the layout calculator's zones drawn by
 * the yard scene. Used by the display step (live while designing) and the
 * review step. The manifest is the same cached file the calculator loads.
 */
export function BookingYardPreview({
  layout,
  typed,
  className,
}: {
  layout: LayoutCalculation;
  typed: { message: string; name: string };
  className?: string;
}) {
  const [byFile, setByFile] = useState<Map<string, SignAsset> | null>(null);

  useEffect(() => {
    let live = true;
    loadManifest()
      .then(m => live && setByFile(new Map(m.assets.map(a => [a.file, a]))))
      .catch(() => live && setByFile(new Map()));
    return () => { live = false; };
  }, []);

  const rows = useMemo(
    () => (byFile ? sceneRowsFromLayout(layout, typed, byFile) : []),
    [layout, typed.message, typed.name, byFile],
  );

  return <YardScene rows={rows} description={describeLayout(layout)} className={className} />;
}
