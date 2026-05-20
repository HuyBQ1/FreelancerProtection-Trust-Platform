import { useEffect, useMemo, useState } from 'react';
import { Bell, CreditCard, FileCheck2, Globe, ImagePlus, Save, ShieldCheck, Upload, UserRound } from 'lucide-react';
import SectionCard from './SectionCard';
import { getStoredLanguage } from '../utils/language';
import { persistStoredUser, stripLargeProfilePayload } from '../utils/storedUser';

const TOKEN_KEY = 'fptp_token';
const USER_KEY = 'fptp_user';
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const PROFILE_URL = `${API_BASE_URL}/users/profile`;
const SETTINGS_URL = `${API_BASE_URL}/users/settings`;
const AVATAR_URL = `${API_BASE_URL}/users/avatar`;
const CV_URL = `${API_BASE_URL}/users/cv`;
const ESCROW_SUMMARY_URL = `${API_BASE_URL}/escrow/summary`;
const TOP_UP_URL = `${API_BASE_URL}/escrow/top-up`;
const WITHDRAW_URL = `${API_BASE_URL}/escrow/withdraw`;
const KYC_API_BASE_URL = import.meta.env.VITE_KYC_API_URL || 'http://localhost:8001';

function buildDefaultForm(user) {
  return {
    fullName: user?.fullName || '',
    email: user?.email || '',
    language: user?.settings?.language || getStoredLanguage(),
    contractAlerts: user?.settings?.notifications?.contractAlerts ?? true,
    payoutAlerts: user?.settings?.notifications?.payoutAlerts ?? true,
    weeklySummary: user?.settings?.notifications?.weeklySummary ?? false,
    companyName: user?.settings?.clientProfile?.companyName || user?.companyName || '',
    companyWebsite: user?.settings?.clientProfile?.companyWebsite || '',
    billingEmail: user?.settings?.clientProfile?.billingEmail || '',
    headline: user?.settings?.freelancerProfile?.headline || user?.headline || '',
    portfolioUrl: user?.settings?.freelancerProfile?.portfolioUrl || '',
    skills: Array.isArray(user?.settings?.freelancerProfile?.skills) ? user.settings.freelancerProfile.skills.join(', ') : '',
    cvFileName: user?.settings?.freelancerProfile?.cvFileName || '',
    cvFileType: user?.settings?.freelancerProfile?.cvFileType || '',
    cvDataUrl: user?.settings?.freelancerProfile?.cvDataUrl || '',
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

function KycVerificationPanel({ user, language }) {
  const isVietnamese = language === 'vi';
  const [kyc, setKyc] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    documentType: 'NATIONAL_ID',
    fullName: user?.fullName || '',
    dateOfBirth: '',
    country: 'Vietnam',
    documentNumber: '',
    address: '',
  });
  const [files, setFiles] = useState({ documentFront: null, documentBack: null, selfie: null });

  const token = localStorage.getItem(TOKEN_KEY);

  useEffect(() => {
    if (!token) return;

    const loadKyc = async () => {
      try {
        const response = await fetch(`${KYC_API_BASE_URL}/kyc/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          setKyc(data);
          setForm((current) => ({
            ...current,
            documentType: data.documentType || current.documentType,
            fullName: data.fullName || current.fullName,
            dateOfBirth: data.dateOfBirth || current.dateOfBirth,
            country: data.country || current.country,
            address: data.address || current.address,
          }));
        }
      } catch {
        // KYC service may be offline while the main app still works.
      }
    };

    loadKyc();
  }, [token]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateFile = (field, file) => {
    setFiles((current) => ({ ...current, [field]: file }));
  };

  const submitKyc = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });

    if (!files.documentFront || !files.selfie) {
      setStatus({
        type: 'error',
        message: isVietnamese ? 'Vui lòng tải mặt trước giấy tờ và ảnh selfie.' : 'Please upload document front and selfie.',
      });
      return;
    }

    if (!token) {
      setStatus({ type: 'error', message: isVietnamese ? 'Bạn cần đăng nhập để xác minh KYC.' : 'Please sign in to submit KYC.' });
      return;
    }

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    body.append('documentFront', files.documentFront);
    body.append('selfie', files.selfie);
    if (files.documentBack) body.append('documentBack', files.documentBack);

    setSubmitting(true);
    try {
      const response = await fetch(`${KYC_API_BASE_URL}/kyc/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'KYC submit failed');
      }
      setKyc(data);
      setFiles({ documentFront: null, documentBack: null, selfie: null });
      setStatus({ type: 'success', message: isVietnamese ? 'Đã gửi hồ sơ KYC cho admin duyệt.' : 'KYC submitted for admin review.' });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Cannot submit KYC.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabel = {
    PENDING: isVietnamese ? 'Chờ duyệt' : 'Pending',
    UNDER_REVIEW: isVietnamese ? 'Đang xem xét' : 'Under review',
    APPROVED: isVietnamese ? 'Đã xác minh' : 'Verified',
    REJECTED: isVietnamese ? 'Bị từ chối' : 'Rejected',
  }[kyc?.status] || (isVietnamese ? 'Chưa gửi' : 'Not submitted');

  const statusTone = kyc?.status === 'APPROVED'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : kyc?.status === 'REJECTED'
      ? 'bg-rose-50 text-rose-700 border-rose-100'
      : 'bg-amber-50 text-amber-700 border-amber-100';

  return (
    <form onSubmit={submitKyc} className="space-y-6">
      <SectionCard className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <p className="muted">{isVietnamese ? 'Xác minh danh tính' : 'Identity verification'}</p>
              <h2 className="text-2xl font-bold text-ink">KYC</h2>
            </div>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone}`}>{statusLabel}</span>
        </div>

        {kyc?.rejectionReason ? (
          <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{kyc.rejectionReason}</p>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Loại giấy tờ' : 'Document type'}</span>
            <select value={form.documentType} onChange={(event) => updateField('documentType', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400">
              <option value="NATIONAL_ID">{isVietnamese ? 'CCCD/CMND' : 'National ID'}</option>
              <option value="PASSPORT">{isVietnamese ? 'Hộ chiếu' : 'Passport'}</option>
              <option value="DRIVER_LICENSE">{isVietnamese ? 'Bằng lái xe' : 'Driver license'}</option>
              <option value="BUSINESS_LICENSE">{isVietnamese ? 'Giấy phép kinh doanh' : 'Business license'}</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Họ và tên trên giấy tờ' : 'Legal full name'}</span>
            <input value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Ngày sinh' : 'Date of birth'}</span>
            <input type="date" value={form.dateOfBirth} onChange={(event) => updateField('dateOfBirth', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Quốc gia' : 'Country'}</span>
            <input value={form.country} onChange={(event) => updateField('country', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Số giấy tờ' : 'Document number'}</span>
            <input value={form.documentNumber} onChange={(event) => updateField('documentNumber', event.target.value)} placeholder={kyc?.documentNumberMasked || ''} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
          </label>
        </div>

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Địa chỉ' : 'Address'}</span>
          <input value={form.address} onChange={(event) => updateField('address', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
        </label>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ['documentFront', isVietnamese ? 'Mặt trước giấy tờ' : 'Document front', true],
            ['documentBack', isVietnamese ? 'Mặt sau giấy tờ' : 'Document back', false],
            ['selfie', isVietnamese ? 'Ảnh selfie' : 'Selfie', true],
          ].map(([field, label, required]) => (
            <label key={field} className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:bg-white">
              <Upload className="h-6 w-6 text-slate-500" />
              <span className="mt-3 text-sm font-bold text-slate-800">{label}{required ? ' *' : ''}</span>
              <span className="mt-1 line-clamp-1 text-xs text-slate-500">{files[field]?.name || (isVietnamese ? 'JPG, PNG, WEBP hoặc PDF' : 'JPG, PNG, WEBP or PDF')}</span>
              <input type="file" accept="image/*,.pdf" onChange={(event) => updateFile(field, event.target.files?.[0] || null)} className="hidden" />
            </label>
          ))}
        </div>

        {status.message ? (
          <p className={`mt-5 rounded-2xl px-4 py-3 text-sm ${status.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {status.message}
          </p>
        ) : null}

        <button type="submit" disabled={submitting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
          <FileCheck2 className="h-4 w-4" />
          {submitting ? (isVietnamese ? 'Đang gửi...' : 'Submitting...') : (isVietnamese ? 'Gửi xác minh KYC' : 'Submit KYC')}
        </button>
      </SectionCard>
    </form>
  );
}

function SettingsPanel({ user, onUserChange, initialSection = 'profile', mode = 'full' }) {
  const [form, setForm] = useState(() => buildDefaultForm(user));
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(initialSection);
  const [cvDirty, setCvDirty] = useState(false);

  const mergeCvIntoUser = (baseUser, cvData) => ({
    ...baseUser,
    settings: {
      ...baseUser?.settings,
      freelancerProfile: {
        ...baseUser?.settings?.freelancerProfile,
        cvFileName: cvData?.cvFileName || baseUser?.settings?.freelancerProfile?.cvFileName || '',
        cvFileType: cvData?.cvFileType || baseUser?.settings?.freelancerProfile?.cvFileType || '',
        cvDataUrl: cvData?.cvDataUrl || baseUser?.settings?.freelancerProfile?.cvDataUrl || '',
      },
    },
  });

  const fetchCvFromServer = async (userId, token) => {
    if (!userId || !token) return null;

    const response = await fetch(`${API_BASE_URL}/users/cv/freelancer/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.cvDataUrl) {
      return null;
    }

    return data;
  };

  useEffect(() => {
    setForm((current) => {
      const nextForm = buildDefaultForm(user);
      return {
        ...nextForm,
        cvFileName: nextForm.cvFileName || current?.cvFileName || '',
        cvFileType: nextForm.cvFileType || current?.cvFileType || '',
        cvDataUrl: nextForm.cvDataUrl || current?.cvDataUrl || '',
      };
    });
    setAvatarPreview(user?.avatar || '');
  }, [user]);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

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

        const syncedUserId = data.user?.id || data.user?._id;
        const cvData = data.user?.role === 'freelancer'
          ? await fetchCvFromServer(syncedUserId, token)
          : null;
        const syncedUser = cvData ? mergeCvIntoUser(data.user, cvData) : data.user;

        if (!isMounted) return;

        persistUser(syncedUser);
        setForm(buildDefaultForm(syncedUser));
        setAvatarPreview(syncedUser.avatar || '');
      } catch {
        // Keep the current local snapshot when the profile sync cannot be reached.
      }
    };

    syncProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userId = user?.id || user?._id;

    if (!token || !userId || user?.role !== 'freelancer') return;

    let isMounted = true;

    const syncCv = async () => {
      try {
        const data = await fetchCvFromServer(userId, token);

        if (!data?.cvDataUrl || !isMounted) return;

        setForm((current) => ({
          ...current,
          cvFileName: data.cvFileName || current.cvFileName,
          cvFileType: data.cvFileType || current.cvFileType,
          cvDataUrl: data.cvDataUrl,
        }));
      } catch {
        // Ignore CV sync errors to avoid blocking settings screen.
      }
    };

    syncCv();
    return () => {
      isMounted = false;
    };
  }, [user?.id, user?._id, user?.role]);


  const safeForm = form || buildDefaultForm(user || {});
  const isVietnamese = safeForm.language === 'vi';
  const roleLabel = useMemo(() => {
    if (user?.role === 'client') return isVietnamese ? 'Khách hàng' : 'Client';
    if (user?.role === 'admin') return isVietnamese ? 'Quản trị viên' : 'Admin';
    return 'Freelancer';
  }, [isVietnamese, user?.role]);
  const maskedAccountNumber = safeForm.accountNumber
    ? safeForm.accountNumber.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim()
    : '•••• •••• •••• 4729';

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const persistUser = (nextUser) => {
    try {
      persistStoredUser(nextUser);
    } catch (error) {
      console.warn('Could not persist full user snapshot to localStorage:', error);
      const fallbackUser = stripLargeProfilePayload(nextUser);
      localStorage.setItem(USER_KEY, JSON.stringify(fallbackUser));
    }
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

  const handleCvChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus({
      type: 'success',
      message: isVietnamese ? `Đã chọn CV: ${file.name}. Bấm Lưu thay đổi để cập nhật hồ sơ.` : `Selected CV: ${file.name}. Save changes to update your profile.`,
    });
    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        cvFileName: file.name,
        cvFileType: file.type || 'application/octet-stream',
        cvDataUrl: `${reader.result || ''}`,
      }));
      setCvDirty(true);
    };
    reader.onerror = () => {
      setStatus({
        type: 'error',
        message: isVietnamese ? 'Không thể đọc file CV này. Hãy chọn file khác.' : 'Could not read this CV file. Please choose another file.',
      });
    };
    reader.readAsDataURL(file);
  };

  const saveLocally = (message = isVietnamese ? 'Cài đặt đã được lưu trên máy.' : 'Settings saved locally.') => {
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
          cvFileName: form.cvFileName,
          cvFileType: form.cvFileType,
          cvDataUrl: form.cvDataUrl,
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
      saveLocally(mode === 'bank' ? (isVietnamese ? 'Tài khoản ngân hàng đã được lưu trên máy.' : 'Bank account saved locally.') : (isVietnamese ? 'Cài đặt đã được lưu trên máy.' : 'Settings saved locally.'));
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

      let latestUser = user;

      if (cvDirty && form.cvFileName && form.cvDataUrl) {
        const cvResponse = await fetch(CV_URL, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            cvFileName: form.cvFileName,
            cvFileType: form.cvFileType,
            cvDataUrl: form.cvDataUrl,
          }),
        });

        const cvData = await cvResponse.json().catch(() => ({}));
        if (!cvResponse.ok) {
          const isMissingCvRoute = cvResponse.status === 404 || `${cvData.message || ''}`.toLowerCase().includes('route not found');
          if (!isMissingCvRoute) {
            throw new Error(cvData.message || 'Could not upload CV.');
          }
        } else {
          latestUser = cvData.user || latestUser;
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

      const cvSnapshot = {
        cvFileName: latestUser?.settings?.freelancerProfile?.cvFileName || form.cvFileName,
        cvFileType: latestUser?.settings?.freelancerProfile?.cvFileType || form.cvFileType,
        cvDataUrl: latestUser?.settings?.freelancerProfile?.cvDataUrl || form.cvDataUrl,
      };
      const mergedUser = user?.role === 'freelancer'
        ? mergeCvIntoUser(settingsData.user || latestUser, cvSnapshot)
        : (settingsData.user || latestUser);
      const mergedForm = buildDefaultForm(mergedUser);

      persistUser(mergedUser);
      setForm(mergedForm);
      setAvatarPreview(mergedUser?.avatar || avatarPreview);
      setCvDirty(false);
      setStatus({
        type: 'success',
        message: mode === 'bank' ? (isVietnamese ? 'Thành công.' : 'Successfully.') : (isVietnamese ? 'Cập nhật cài đặt thành công.' : 'Settings updated successfully.'),
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not save your changes to the server.',
      });
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
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">{isVietnamese ? 'Ngân hàng' : 'Bank'}</p>
                    <p className="mt-1 text-lg font-semibold">{form.bankName || (isVietnamese ? 'Ngân hàng của bạn' : 'Your Bank')}</p>
                  </div>
                </div>

                <div className="mt-10">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">{isVietnamese ? 'Số tài khoản' : 'Card Number'}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[0.18em]">{maskedAccountNumber}</p>
                </div>

                <div className="mt-10 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">{isVietnamese ? 'Chủ tài khoản' : 'Account Holder'}</p>
                    <p className="mt-2 text-lg font-semibold">{form.accountName || user?.fullName || (isVietnamese ? 'Chủ tài khoản' : 'Account Holder')}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">{isVietnamese ? 'Mã SWIFT / Định tuyến' : 'Swift / Routing'}</p>
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
                <p className="muted">{isVietnamese ? 'Tài khoản nhận tiền' : 'Withdrawal destination'}</p>
                <h3 className="mt-1 text-3xl font-bold tracking-tight text-ink">{isVietnamese ? 'Kết nối thông tin ngân hàng' : 'Connect your bank details'}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {isVietnamese
                    ? 'Tài khoản này sẽ được dùng để rút tiền và nhận thanh toán. Hãy cập nhật các trường bên dưới và lưu để đồng bộ với thẻ hiển thị.'
                    : 'This account will be used for payout withdrawals and escrow releases. Update the fields below and save to keep the card in sync.'}
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Tên ngân hàng' : 'Bank name'}</span>
                    <input value={form.bankName} onChange={(event) => updateField('bankName', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Tên chủ tài khoản' : 'Account holder name'}</span>
                    <input value={form.accountName} onChange={(event) => updateField('accountName', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
                  </label>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Số tài khoản' : 'Account number'}</span>
                    <input value={form.accountNumber} onChange={(event) => updateField('accountNumber', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Mã SWIFT / định tuyến' : 'SWIFT / routing code'}</span>
                    <input value={form.swiftCode} onChange={(event) => updateField('swiftCode', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
                  </label>
                </div>

                {status.message ? (
                  <p className={`mt-6 rounded-2xl px-4 py-3 text-sm ${status.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {status.message}
                  </p>
                ) : null}

                <button type="submit" disabled={saving} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                  <Save className="h-4 w-4" />
                  {saving ? (isVietnamese ? 'Đang lưu...' : 'Saving...') : (isVietnamese ? 'Lưu tài khoản ngân hàng' : 'Save bank account')}
                </button>
              </div>
            </div>
          </div>
        </SectionCard>
      </form>
    );
  }

  if (activeSection === 'kyc') {
    return <KycVerificationPanel user={user} language={form.language} />;
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
                <p className="muted">{isVietnamese ? 'Cài đặt tài khoản' : 'Account settings'}</p>
                <h2 className="text-2xl font-bold text-ink">{isVietnamese ? `Hồ sơ ${roleLabel.toLowerCase()}` : `${roleLabel} profile`}</h2>
            </div>
          </div>

          {mode !== 'bank' ? (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Họ và tên' : 'Full name'}</span>
              <input value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input value={form.email} onChange={(event) => updateField('email', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Ngôn ngữ' : 'Language'}</span>
              <select value={form.language} onChange={(event) => updateField('language', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400">
                <option value="en">{isVietnamese ? 'Tiếng Anh' : 'English'}</option>
                <option value="vi">{isVietnamese ? 'Tiếng Việt' : 'Vietnamese'}</option>
              </select>
            </label>
            <div className="space-y-2">
              <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Vai trò' : 'Role'}</span>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-700">{roleLabel}</div>
            </div>
          </div>

          {user?.role === 'client' ? (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-ink">
                <ShieldCheck className="h-5 w-5 text-pine" />
                <h3 className="text-lg font-semibold">{isVietnamese ? 'Cài đặt khách hàng' : 'Client settings'}</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Tên công ty' : 'Company name'}</span>
                  <input value={form.companyName} onChange={(event) => updateField('companyName', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Email thanh toán' : 'Billing email'}</span>
                  <input value={form.billingEmail} onChange={(event) => updateField('billingEmail', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
                </label>
              </div>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Website công ty' : 'Company website'}</span>
                <input value={form.companyWebsite} onChange={(event) => updateField('companyWebsite', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
              </label>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-ink">
                <ShieldCheck className="h-5 w-5 text-pine" />
                <h3 className="text-lg font-semibold">{isVietnamese ? 'Cài đặt freelancer' : 'Freelancer settings'}</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Tiêu đề hồ sơ' : 'Headline'}</span>
                  <input value={form.headline} onChange={(event) => updateField('headline', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Liên kết portfolio' : 'Portfolio URL'}</span>
                  <input value={form.portfolioUrl} onChange={(event) => updateField('portfolioUrl', event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
                </label>
              </div>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">{isVietnamese ? 'Kỹ năng' : 'Skills'}</span>
                <input value={form.skills} onChange={(event) => updateField('skills', event.target.value)} placeholder={isVietnamese ? 'React, Tailwind, Thiết kế UI' : 'React, Tailwind, UI Design'} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400" />
              </label>
            </div>
          )}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{isVietnamese ? 'CV hồ sơ' : 'Profile CV'}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {form.cvFileName || (isVietnamese ? 'Chưa upload CV' : 'No CV uploaded yet')}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Upload className="h-4 w-4" />
                  {isVietnamese ? 'Chọn file CV' : 'Choose CV file'}
                </label>
                <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={handleCvChange} className="block w-full max-w-xs rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
              </div>
            </div>
            {form.cvDataUrl ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={form.cvDataUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">
                  {isVietnamese ? 'Xem CV' : 'View CV'}
                </a>
                <a href={form.cvDataUrl} download={form.cvFileName || 'profile-cv'} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  {isVietnamese ? 'Tải CV' : 'Download CV'}
                </a>
              </div>
            ) : null}
          </div>
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
                <p className="muted">{isVietnamese ? 'Ảnh hồ sơ' : 'Profile image'}</p>
                <h3 className="text-xl font-bold text-ink">{isVietnamese ? 'Ảnh đại diện' : 'Avatar'}</h3>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-4">
              {avatarPreview ? <img src={avatarPreview} alt={isVietnamese ? 'Xem trước ảnh đại diện' : 'Avatar preview'} className="h-20 w-20 rounded-3xl object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-2xl font-bold text-slate-500">{(user?.fullName || user?.email || 'U')[0]?.toUpperCase()}</div>}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                <ImagePlus className="h-4 w-4" />
                {isVietnamese ? 'Tải ảnh lên' : 'Upload avatar'}
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
                <p className="muted">{isVietnamese ? 'Thông báo' : 'Notifications'}</p>
                <h3 className="text-xl font-bold text-ink">{isVietnamese ? 'Cảnh báo và cập nhật' : 'Alerts and updates'}</h3>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <Toggle checked={form.contractAlerts} onChange={(value) => updateField('contractAlerts', value)} label={isVietnamese ? 'Cảnh báo hợp đồng' : 'Contract alerts'} description={isVietnamese ? 'Thông báo khi milestone thay đổi hoặc cần xử lý.' : 'Notify me when a milestone changes or needs action.'} />
              <Toggle checked={form.payoutAlerts} onChange={(value) => updateField('payoutAlerts', value)} label={isVietnamese ? 'Cảnh báo thanh toán' : 'Payout alerts'} description={isVietnamese ? 'Thông báo khi tiền được nạp, giải ngân hoặc bị chặn.' : 'Notify me when escrow is funded, released, or blocked.'} />
              <Toggle checked={form.weeklySummary} onChange={(value) => updateField('weeklySummary', value)} label={isVietnamese ? 'Tóm tắt hàng tuần' : 'Weekly summary'} description={isVietnamese ? 'Gửi bản tóm tắt hàng tuần về hợp đồng, công việc và tranh chấp.' : 'Send a weekly digest of contracts, jobs, and disputes.'} />
            </div>
          </SectionCard>

          <SectionCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="muted">{isVietnamese ? 'Lưu thay đổi' : 'Save changes'}</p>
                <h3 className="text-xl font-bold text-ink">{isVietnamese ? 'Cập nhật tài khoản' : 'Update account'}</h3>
              </div>
            </div>
            {status.message ? (
              <p className={`mt-5 rounded-2xl px-4 py-3 text-sm ${status.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {status.message}
              </p>
            ) : null}
            <button type="submit" disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              <Save className="h-4 w-4" />
              {saving ? (isVietnamese ? 'Đang lưu...' : 'Saving...') : (isVietnamese ? 'Lưu thay đổi' : 'Save changes')}
            </button>
          </SectionCard>
        </div>
      </div>
    </form>
  );
}

export default SettingsPanel;
