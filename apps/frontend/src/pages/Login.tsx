import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function LoginPage() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        const { needsConfirmation } = await signUpWithEmail(email, password);
        if (needsConfirmation) {
          toast('Check your email to confirm your account.', 'info');
        }
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Authentication failed.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-electric-500 text-xl font-bold text-white">
            V
          </div>
          <h1 className="mt-4 text-2xl font-bold text-platinum-50">VaultBridge</h1>
          <p className="text-sm text-platinum-400">
            Secure NFT withdrawal assistant by Flipping Labs
          </p>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex rounded-lg border border-obsidian-700 p-1 text-sm">
            <button
              className={`flex-1 rounded-md py-1.5 font-medium transition ${
                mode === 'signin' ? 'bg-electric-500 text-white' : 'text-platinum-300'
              }`}
              onClick={() => setMode('signin')}
            >
              Sign in
            </button>
            <button
              className={`flex-1 rounded-md py-1.5 font-medium transition ${
                mode === 'signup' ? 'bg-electric-500 text-white' : 'text-platinum-300'
              }`}
              onClick={() => setMode('signup')}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-platinum-400">
            <div className="h-px flex-1 bg-obsidian-700" />
            OR
            <div className="h-px flex-1 bg-obsidian-700" />
          </div>

          <button
            className="btn-secondary w-full"
            onClick={() =>
              signInWithGoogle().catch((e) =>
                toast(e instanceof Error ? e.message : 'Google sign-in failed.', 'error'),
              )
            }
          >
            Continue with Google
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-platinum-400">
          VaultBridge never stores Crypto.com credentials or private keys. It helps you organize
          and track withdrawals you perform yourself.
        </p>
      </div>
    </div>
  );
}
