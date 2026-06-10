import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { SafetyNotice } from '../components/SafetyNotice';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';

export function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(
    (user?.user_metadata?.full_name as string | undefined) ?? '',
  );
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: displayName } });
      if (error) throw error;
      // Keep the profiles table in sync with the auth metadata.
      await supabase.from('profiles').update({ display_name: displayName }).eq('id', user?.id);
      toast('Profile updated.', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Update failed.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Settings">
      <div className="max-w-2xl space-y-6">
        <section className="card space-y-4 p-5">
          <h2 className="text-base font-semibold text-platinum-100">Profile</h2>
          <div>
            <label className="label">Email</label>
            <input className="input" value={user?.email ?? ''} disabled />
          </div>
          <div>
            <label className="label">Display name</label>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <button className="btn-primary" onClick={saveProfile} disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="text-base font-semibold text-platinum-100">Security &amp; compliance</h2>
          <ul className="space-y-2 text-sm text-platinum-300">
            <li>✓ VaultBridge never stores Crypto.com credentials.</li>
            <li>✓ No private keys are ever stored — wallet addresses only.</li>
            <li>✓ It does not automate logins, 2FA, email codes, or captchas.</li>
            <li>✓ Every destructive action requires explicit confirmation.</li>
            <li>✓ Your data is isolated by row-level security; only you can read it.</li>
          </ul>
        </section>

        <section className="card space-y-2 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-platinum-100">Billing</h2>
            <span className="rounded-full border border-obsidian-600 bg-obsidian-800 px-2 py-0.5 text-[10px] uppercase text-platinum-400">
              Not active
            </span>
          </div>
          <p className="text-sm text-platinum-400">
            VaultBridge is free during MVP testing. Stripe billing is wired into the structure but
            intentionally disabled.
          </p>
        </section>

        <SafetyNotice />
      </div>
    </AppShell>
  );
}
