/** A display snapshot URL saveDisplaySnapshot (actions.ts) made for this hold */
export function isDisplaySnapshotUrl(url: string, holdId: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:'
      && u.hostname.endsWith('.public.blob.vercel-storage.com')
      && u.pathname.startsWith(`/displays/${holdId}-`)
      && u.pathname.endsWith('.jpg');
  } catch {
    return false;
  }
}
