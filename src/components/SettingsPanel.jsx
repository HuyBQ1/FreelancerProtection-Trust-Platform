import { useEffect, useMemo, useState } from 'react';
import { Bell, CreditCard, Globe, ImagePlus, Save, ShieldCheck, UserRound } from 'lucide-react';
import SectionCard from './SectionCard';

const TOKEN_KEY = 'fptp_token';
const USER_KEY = 'fptp_user';
<<<<<<< HEAD
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const PROFILE_URL = `${API_BASE_URL}/users/profile`;
const SETTINGS_URL = `${API_BASE_URL}/users/settings`;
const AVATAR_URL = `${API_BASE_URL}/users/avatar`;
=======
const PROFILE_URL = 'http://localhost:5000/api/users/profile';
const SETTINGS_URL = 'http://localhost:5000/api/users/settings';
const AVATAR_URL = 'http://localhost:5000/api/users/avatar';
>>>>>>> origin/review

function buildDefaultForm(user) {
  return {
    fullName: user?.fullName || '',
    email: user?.email || '',
    language: user?.settings?.language || 'en',
    contractAlerts: user?.settings?.notifications?.contractAlerts ?? true,
    payoutAlerts: user?.settings?.notifications?.payoutAlerts ?? true,
    weeklySummary: user?.settings?.notifications?.weeklySummary ?? false,
    companyName: user?.settings?.clientProfile?.companyName || user?.companyName || '',
    companyWebsite: user?.settings?.clientProfile?.companyWebsite || '',
    billingEmail: user?.settings?.clientProfile?.billingEmail || '',
    headline: user?.settings?.freelancerProfile?.headline || user?.headline || '',
    portfolioUrl: user?.settings?.freelancerProfile?.portfolioUrl || '',
    skills: Array.isArray(user?.settings?.freelancerProfile?.skills) ? user.settings.freelancerProfile.skills.join(', ') : '',
    bankName: user?.settings?.bankAccount?.bankName || '',
    accountName: user?.settings?.bankAccount?.accountName || '',
    accountNumber: user?.settings?.bankAccount?.accountNumber || '',
    swiftCode: user?.settings?.bankAccount?.swiftCode || '',
  };
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left"
    >
      <div>
        <p className="font-semibold text-ink">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <span className={`relative inline-flex h-7 w-12 rounded-full transition ${checked ? 'bg-pine' : 'bg-slate-200'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${checked ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  );
}

function SettingsPanel({ user, onUserChange, initialSection = 'profile', mode = 'full' }) {
  const [form, setForm] = useState(() => buildDefaultForm(user));
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    setForm(buildDefaultForm(user));
    setAvatarPreview(user?.avatar || '');
  }, [user]);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

<<<<<<< HEAD
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    let isMounted = true;

    const syncProfile = async () => {
      try {
        const response = await fetch(PROFILE_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.user || !isMounted) return;

        persistUser(data.user);
        setForm(buildDefaultForm(data.user));
        setAvatarPreview(data.user.avatar || '');
      } catch {
        // Keep the current local snapshot when the profile sync cannot be reached.
      }
    };

    syncProfile();

    return () => {
      isMounted = false;
    };
  }, []);

=======
>>>>>>> origin/review
  const roleLabel = useMemo(() => (user?.role === 'client' ? 'Client' : 'Freelancer'), [user?.role]);
  const maskedAccountNumber = form.accountNumber
    ? form.accountNumber.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim()
    : '•••• •••• •••• 4729';

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const persistUser = (nextUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    onUserChange(nextUser);
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setAvatarPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const saveLocally = (message = 'Settings saved locally.') => {
    const nextUser = {
      ...user,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      avatar: avatarPreview,
      companyName: form.companyName.trim(),
      headline: form.headline.trim(),
      settings: {
        ...user?.settings,
        language: form.language,
        notifications: {
          contractAlerts: form.contractAlerts,
          payoutAlerts: form.payoutAlerts,
          weeklySummary: form.weeklySummary,
        },
        clientProfile: {
          companyName: form.companyName.trim(),
          companyWebsite: form.companyWebsite.trim(),
          billingEmail: form.billingEmail.trim(),
        },
        freelancerProfile: {
          headline: form.headline.trim(),
          portfolioUrl: form.portfolioUrl.trim(),
          skills: form.skills.split(',').map((item) => item.trim()).filter(Boolean),
        },
        bankAccount: {
          bankName: form.bankName.trim(),
          accountName: form.accountName.trim(),
          accountNumber: form.accountNumber.trim(),
          swiftCode: form.swiftCode.trim(),
        },
      },
    };

    persistUser(nextUser);
    setStatus({ type: 'success', message });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });
    setSaving(true);

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
<<<<<<< HEAD
      saveLocally(mode === 'bank' ? 'Bank account saved locally.' : 'Settings saved locally.');
=======
      saveLocally();
>>>>>>> origin/review
      setSaving(false);
      return;
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      if (avatarPreview && avatarPreview !== user?.avatar) {
        const avatarResponse = await fetch(AVATAR_URL, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ avatar: avatarPreview }),
        });

        if (!avatarResponse.ok) {
          const errorData = await avatarResponse.json().catch(() => ({}));
          throw new Error(errorData.message || 'Could not update avatar.');
        }
      }

      const profileResponse = await fetch(PROFILE_URL, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          companyName: form.companyName,
          headline: form.headline,
          language: form.language,
        }),
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Could not update profile.');
      }

      const settingsResponse = await fetch(SETTINGS_URL, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          language: form.language,
          notifications: {
            contractAlerts: form.contractAlerts,
            payoutAlerts: form.payoutAlerts,
            weeklySummary: form.weeklySummary,
          },
          roleSettings: user?.role === 'client'
            ? {
              companyName: form.companyName,
              companyWebsite: form.companyWebsite,
              billingEmail: form.billingEmail,
            }
            : {
              headline: form.headline,
              portfolioUrl: form.portfolioUrl,
              skills: form.skills.split(',').map((item) => item.trim()).filter(Boolean),
            },
          bankAccount: {
            bankName: form.bankName,
            accountName: form.accountName,
            accountNumber: form.accountNumber,
            swiftCode: form.swiftCode,
          },
        }),
      });

      const settingsData = await settingsResponse.json().catch(() => ({}));

      if (!settingsResponse.ok) {
        throw new Error(settingsData.message || 'Could not update settings.');
      }

      persistUser(settingsData.user);
<<<<<<< HEAD
      setStatus({
        type: 'success',
        message: mode === 'bank' ? 'Successfully.' : 'Settings updated successfully.',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not save your changes to the server.',
      });
=======
      setStatus({ type: 'success', message: 'Settings updated successfully.' });
    } catch (error) {
      saveLocally(error instanceof Error ? `${error.message} Saved locally instead.` : 'Settings saved locally.');
>>>>>>> origin/review
    } finally {
      setSaving(false);
    }
  };

  if (mode === 'bank') {
    return (
      <form onSubmit={handleSave} className="space-y-6">
        <SectionCard className="overflow-hidden p-0">
          <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_35%),linear-gradient(135deg,_#0f172a,_#1d4ed8_55%,_#06b6d4)] p-6 text-white sm:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-white/60">Bank Account</p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight">Payout Card</h2>
                </div>
                <div className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  Visa
                </div>
              </div>

              <div className="mt-10 max-w-xl rounded-[32px] border border-white/15 bg-white/10 p-6 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/15">
                    <span className="text-base font-black italic tracking-[0.18em] text-white">VISA</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Bank</p>
                    <p className="mt-1 text-lg font-semibold">{form.bankName || 'Your Bank'}</p>
                  </div>
                </div>

                <div className="mt-10">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">Card Number</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[0.18em]">{maskedAccountNumber}</p>
                </div>

                <div className="mt-10 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Account Holder</p>
                    <p className="mt-2 text-lg font-semibold">{form.accountName || user?.fullName || 'Account Holder'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Swift / Routing</p>
                    <p className="mt-2 text-lg font-semibold">{form.swiftCode || 'SWFT-2048'}</p>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <span className="text-3xl font-black italic tracking-[0.25em] text-white/90">
                    VISA
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8">
              <div className="max-w-xl">
                <p className="muted">Withdrawal destination</p>
                <h3 className="mt-1 text-3xl font-bold tracking-tight text-ink">Connect your bank details</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  This account will be used for payout withdrawals and escrow releases. Update the fields below and save to keep the card in sync.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Bank name</span>
                    <input value={form.bankName} onChange={(event) => updateField('bankName', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Account holder name</span>
                    <input value={form.accountName} onChange={(event) => updateField('accountName', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
                  </label>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Account number</span>
                    <input value={form.accountNumber} onChange={(event) => updateField('accountNumber', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">SWIFT / routing code</span>
                    <input value={form.swiftCode} onChange={(event) => updateField('swiftCode', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
                  </label>
                </div>

<<<<<<< HEAD
                {status.message ? (
                  <p className={`mt-6 rounded-2xl px-4 py-3 text-sm ${status.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {status.message}
                  </p>
                ) : null}
=======
                {status.message ? <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status.message}</p> : null}
>>>>>>> origin/review

                <button type="submit" disabled={saving} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save bank account'}
                </button>
              </div>
            </div>
          </div>
        </SectionCard>
      </form>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pine/10 text-pine">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <p className="muted">Account settings</p>
              <h2 className="text-2xl font-bold text-ink">{roleLabel} profile</h2>
            </div>
          </div>

          {mode !== 'bank' ? (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Full name</span>
              <input value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input value={form.email} onChange={(event) => updateField('email', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Language</span>
              <select value={form.language} onChange={(event) => updateField('language', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400">
                <option value="en">English</option>
                <option value="vi">Vietnamese</option>
              </select>
            </label>
            <div className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Role</span>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-700">{roleLabel}</div>
            </div>
          </div>

          {user?.role === 'client' ? (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-ink">
                <ShieldCheck className="h-5 w-5 text-pine" />
                <h3 className="text-lg font-semibold">Client settings</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Company name</span>
                  <input value={form.companyName} onChange={(event) => updateField('companyName', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Billing email</span>
                  <input value={form.billingEmail} onChange={(event) => updateField('billingEmail', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
                </label>
              </div>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Company website</span>
                <input value={form.companyWebsite} onChange={(event) => updateField('companyWebsite', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
              </label>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-ink">
                <ShieldCheck className="h-5 w-5 text-pine" />
                <h3 className="text-lg font-semibold">Freelancer settings</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Headline</span>
                  <input value={form.headline} onChange={(event) => updateField('headline', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Portfolio URL</span>
                  <input value={form.portfolioUrl} onChange={(event) => updateField('portfolioUrl', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
                </label>
              </div>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Skills</span>
                <input value={form.skills} onChange={(event) => updateField('skills', event.target.value)} placeholder="React, Tailwind, UI Design" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
              </label>
            </div>
          )}
            </>
          ) : null}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-coral/10 text-coral">
                <ImagePlus className="h-5 w-5" />
              </div>
              <div>
                <p className="muted">Profile image</p>
                <h3 className="text-xl font-bold text-ink">Avatar</h3>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-4">
              {avatarPreview ? <img src={avatarPreview} alt="Avatar preview" className="h-20 w-20 rounded-3xl object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-2xl font-bold text-slate-500">{(user?.fullName || user?.email || 'U')[0]?.toUpperCase()}</div>}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                <ImagePlus className="h-4 w-4" />
                Upload avatar
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
          </SectionCard>

          <SectionCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="muted">Notifications</p>
                <h3 className="text-xl font-bold text-ink">Alerts and updates</h3>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <Toggle checked={form.contractAlerts} onChange={(value) => updateField('contractAlerts', value)} label="Contract alerts" description="Notify me when a milestone changes or needs action." />
              <Toggle checked={form.payoutAlerts} onChange={(value) => updateField('payoutAlerts', value)} label="Payout alerts" description="Notify me when escrow is funded, released, or blocked." />
              <Toggle checked={form.weeklySummary} onChange={(value) => updateField('weeklySummary', value)} label="Weekly summary" description="Send a weekly digest of contracts, jobs, and disputes." />
            </div>
          </SectionCard>

          <SectionCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="muted">Save changes</p>
                <h3 className="text-xl font-bold text-ink">Update account</h3>
              </div>
            </div>
<<<<<<< HEAD
            {status.message ? (
              <p className={`mt-5 rounded-2xl px-4 py-3 text-sm ${status.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {status.message}
              </p>
            ) : null}
=======
            {status.message ? <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status.message}</p> : null}
>>>>>>> origin/review
            <button type="submit" disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </SectionCard>
        </div>
      </div>
    </form>
  );
}

export default SettingsPanel;
