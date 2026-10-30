'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { sendCodeAction, startDemoAction } from '../actions';
import { CONSENT_TEXT } from '../config';

/** The prospect's two steps: get the code at their email, type it in */
export function StartDemo({ token, maskedEmail, codeAlreadySent, running }: {
  token: string;
  maskedEmail: string;
  codeAlreadySent: boolean;
  running: boolean;
}) {
  const [sent, setSent] = useState(codeAlreadySent);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    setMessage(null);
    startTransition(async () => {
      const result = await sendCodeAction(token);
      if (result.ok) {
        setSent(true);
        setMessage({ tone: 'info', text: `Code sent to ${maskedEmail}. It can take a minute to arrive.` });
      } else {
        setMessage({ tone: 'error', text: result.error });
      }
    });
  }

  function start(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await startDemoAction(token, code);
      if (result.ok) window.location.assign(result.url);
      else setMessage({ tone: 'error', text: result.error });
    });
  }

  return (
    <div className="grid gap-5">
      {!sent ? (
        <>
          <p className="text-copy">We’ll email a code to <strong>{maskedEmail}</strong>.</p>
          <Button onClick={send} disabled={pending} className="w-full">{pending ? 'Sending…' : 'Send my code'}</Button>
          <p className="text-fine text-fg-muted">{CONSENT_TEXT}</p>
        </>
      ) : (
        <form onSubmit={start} className="grid gap-3">
          <label className="grid gap-1 text-fine font-semibold">
            Code from your email
            <input value={code} onChange={e => setCode(e.target.value)} required autoFocus autoComplete="one-time-code"
              inputMode="text" maxLength={12} placeholder="K7M2QX"
              className="h-12 rounded-control border border-line-strong bg-surface px-3 text-center font-display text-heading tracking-[0.3em] uppercase focus-visible:border-focus focus-visible:shadow-(--focus-ring) focus-visible:outline-none" />
          </label>
          <Button type="submit" disabled={pending || code.trim().length < 6} className="w-full">
            {pending ? (running ? 'Signing you in…' : 'Setting up your demo…') : running ? 'Back to my demo' : 'Start my demo'}
          </Button>
          <button type="button" onClick={send} disabled={pending} className="text-fine text-action-text hover:underline disabled:opacity-50">
            Send a new code to {maskedEmail}
          </button>
        </form>
      )}
      {message && (
        <p role={message.tone === 'error' ? 'alert' : 'status'} className={message.tone === 'error' ? 'text-fine text-danger' : 'text-fine text-positive'}>
          {message.text}
        </p>
      )}
    </div>
  );
}
