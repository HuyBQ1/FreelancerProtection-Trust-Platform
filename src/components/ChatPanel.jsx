import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, DollarSign, Paperclip, PencilLine, Search, SendHorizonal, Trash2, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import SectionCard from './SectionCard';
import { getStoredLanguage } from '../utils/language';
import { parseMoneyAmount } from '../utils/money';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const THREADS_URL = `${API_BASE_URL}/chat/threads`;
const TOKEN_KEY = 'fptp_token';
const SOCKET_URL = API_BASE_URL.startsWith('http')
  ? API_BASE_URL.replace(/\/api$/, '')
  : (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);

function isJobCompleted(job) {
  const milestones = Array.isArray(job?.contractState?.milestones)
    ? job.contractState.milestones
    : [];

  return job?.status === 'closed'
    || job?.contractState?.status === 'Completed'
    || (milestones.length > 0 && milestones.every((milestone) => milestone.status === 'Approved'));
}

function ChatPanel({ currentUser, userName, initialThreadId = '', onDealUpdated }) {
  const navigate = useNavigate();
  const isVietnamese = (currentUser?.settings?.language || getStoredLanguage()) === 'vi';
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dealAmount, setDealAmount] = useState('');
  const [dealMilestoneIndex, setDealMilestoneIndex] = useState('');
  const [selectedDealJobId, setSelectedDealJobId] = useState('');
  const [dealPanelOpen, setDealPanelOpen] = useState(false);
  const [dealSaving, setDealSaving] = useState(false);
  const [dealJobs, setDealJobs] = useState([]);
  const [relatedJobDetails, setRelatedJobDetails] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedThreadIds, setSelectedThreadIds] = useState([]);
  const [deletingThreads, setDeletingThreads] = useState(false);

  const token = localStorage.getItem(TOKEN_KEY);

  const visibleThreads = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return threads;

    return threads.filter((thread) => (
      `${thread.participant} ${thread.contract} ${thread.lastMessage}`.toLowerCase().includes(keyword)
    ));
  }, [search, threads]);

  const selectedThread = useMemo(
    () => visibleThreads.find((thread) => thread.id === selectedThreadId)
      ?? threads.find((thread) => thread.id === selectedThreadId)
      ?? visibleThreads[0]
      ?? threads[0]
      ?? null,
    [selectedThreadId, threads, visibleThreads],
  );
  const dealJobOptions = useMemo(() => {
    if (!selectedThread) return dealJobs;

    return dealJobs.filter((job) => {
      if (currentUser?.role === 'client' && selectedThread.participantId) {
        return !job.assignedFreelancerId || `${job.assignedFreelancerId}` === `${selectedThread.participantId}`;
      }

      if (currentUser?.role === 'freelancer' && selectedThread.participantId) {
        return `${job.clientId}` === `${selectedThread.participantId}`;
      }

      return true;
    });
  }, [currentUser?.role, dealJobs, selectedThread]);

  const activeDealJobId = selectedDealJobId || selectedThread?.jobId || '';

  const relatedJob = useMemo(() => {
    if (!selectedThread) return null;

    if (activeDealJobId) {
      const matchingJobDetails = relatedJobDetails && `${relatedJobDetails.id}` === `${activeDealJobId}`
        ? relatedJobDetails
        : null;

      return matchingJobDetails || dealJobOptions.find((job) => `${job.id}` === `${activeDealJobId}`) || { id: activeDealJobId, milestones: [] };
    }

    return dealJobOptions.find((job) => (
      job.title?.trim().toLowerCase() === selectedThread.contract?.trim().toLowerCase()
    )) || null;
  }, [activeDealJobId, dealJobOptions, relatedJobDetails, selectedThread]);
  const relatedMilestones = Array.isArray(relatedJob?.milestones) ? relatedJob.milestones : [];
  const dealLocked = isJobCompleted(relatedJob);

  useEffect(() => {
    if (initialThreadId) {
      setSelectedThreadId(initialThreadId);
    }
  }, [initialThreadId]);

  useEffect(() => {
    if (!selectedThread?.deal) {
      setDealAmount('');
      setDealMilestoneIndex('');
      setSelectedDealJobId(selectedThread?.jobId || '');
      return;
    }

    setSelectedDealJobId(selectedThread.jobId || '');
    setDealAmount(selectedThread.deal.amount ? `${selectedThread.deal.amount}` : '');
    setDealMilestoneIndex(Number.isInteger(selectedThread.deal.milestoneIndex) ? `${selectedThread.deal.milestoneIndex}` : '');
  }, [selectedThread?.id, selectedThread?.jobId, selectedThread?.deal?.amount, selectedThread?.deal?.milestoneIndex]);

  const upsertThread = (nextThread, { select = false } = {}) => {
    setThreads((current) => {
      const remaining = current.filter((thread) => thread.id !== nextThread.id);
      return [nextThread, ...remaining];
    });
    if (select) {
      setSelectedThreadId(nextThread.id);
    }
  };

  const removeThread = (threadId) => {
    setThreads((current) => current.filter((thread) => thread.id !== threadId));
    setSelectedThreadIds((current) => current.filter((id) => id !== threadId));
    setSelectedThreadId((current) => (current === threadId ? '' : current));
  };

  const fetchThreads = async ({ silent = false } = {}) => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await fetch(THREADS_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || (isVietnamese ? 'Không thể tải danh sách cuộc trò chuyện.' : 'Could not load chat threads.'));
      }

      const nextThreads = Array.isArray(data.threads) ? data.threads : [];
      setThreads(nextThreads);
      setSelectedThreadId((currentSelectedThreadId) => {
        const hasCurrentThread = nextThreads.some((thread) => thread.id === currentSelectedThreadId);
        if (hasCurrentThread) {
          return currentSelectedThreadId;
        }

        const hasInitialThread = initialThreadId && nextThreads.some((thread) => thread.id === initialThreadId);
        if (hasInitialThread) {
          return initialThreadId;
        }

        return nextThreads[0]?.id || currentSelectedThreadId;
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : (isVietnamese ? 'Không thể tải danh sách cuộc trò chuyện.' : 'Could not load chat threads.'),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    if (!token || !['client', 'freelancer'].includes(currentUser?.role)) return;

    const fetchDealJobs = async () => {
      try {
        const endpoint = currentUser.role === 'client' ? '/jobs/mine' : '/jobs/assigned';
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          setDealJobs(Array.isArray(data.jobs) ? data.jobs : []);
        }
      } catch {
        setDealJobs([]);
      }
    };

    fetchDealJobs();
  }, [currentUser?.role, token]);

  useEffect(() => {
    if (!token || !activeDealJobId) {
      setRelatedJobDetails(null);
      return;
    }

    const threadJobId = activeDealJobId;
    setRelatedJobDetails(null);

    const fetchRelatedJob = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/jobs/${threadJobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json().catch(() => ({}));

        if (response.ok && data.job) {
          setRelatedJobDetails(`${data.job.id}` === `${threadJobId}` ? data.job : null);
        } else {
          setRelatedJobDetails(null);
        }
      } catch {
        setRelatedJobDetails(null);
      }
    };

    fetchRelatedJob();
  }, [activeDealJobId, token]);

  useEffect(() => {
    if (!token || !selectedThread?.id || !selectedThread.unread) return;

    const markRead = async () => {
      try {
        const response = await fetch(`${THREADS_URL}/${selectedThread.id}/read`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => ({}));
        if (response.ok && data.thread) {
          upsertThread(data.thread);
        }
      } catch {
        // Ignore silent read sync failures.
      }
    };

    markRead();
  }, [selectedThread?.id]);

  useEffect(() => {
    if (!token) return undefined;

    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    socket.on('chat:thread-updated', ({ thread }) => {
      if (!thread) return;
      upsertThread(thread);
    });
    socket.on('chat:thread-removed', ({ threadId }) => {
      if (!threadId) return;
      removeThread(threadId);
    });

    socket.on('connect_error', () => {
      setStatus((current) => (
        current.type === 'error'
          ? current
          : {
            type: 'error',
            message: 'Realtime chat is unavailable right now.',
          }
      ));
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const toggleDeleteMode = () => {
    setDeleteMode((current) => !current);
    setSelectedThreadIds([]);
  };

  const toggleThreadSelection = (threadId) => {
    setSelectedThreadIds((current) => (
      current.includes(threadId)
        ? current.filter((id) => id !== threadId)
        : [...current, threadId]
    ));
  };

  const handleDeleteSelectedThreads = async () => {
    if (!token || deletingThreads || selectedThreadIds.length === 0) return;

    setDeletingThreads(true);
    setStatus({ type: '', message: '' });

    try {
      await Promise.all(selectedThreadIds.map(async (threadId) => {
        const response = await fetch(`${THREADS_URL}/${threadId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || (isVietnamese ? 'Không thể xóa cuộc trò chuyện.' : 'Could not delete chat thread.'));
        }
        removeThread(threadId);
      }));

      setDeleteMode(false);
      setSelectedThreadIds([]);
      setStatus({ type: 'success', message: isVietnamese ? 'Đã xóa cuộc trò chuyện đã chọn.' : 'Selected conversations deleted.' });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : (isVietnamese ? 'Không thể xóa cuộc trò chuyện.' : 'Could not delete chat thread.'),
      });
    } finally {
      setDeletingThreads(false);
    }
  };

  const handleSend = async () => {
    if (!token || !selectedThread?.id || !draft.trim()) return;

    setSending(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${THREADS_URL}/${selectedThread.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: draft.trim() }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || (isVietnamese ? 'Không thể gửi tin nhắn.' : 'Could not send the message.'));
      }

      if (data.thread) {
        upsertThread(data.thread, { select: true });
      }
      setDraft('');
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : (isVietnamese ? 'Không thể gửi tin nhắn.' : 'Could not send the message.'),
      });
    } finally {
      setSending(false);
    }
  };

  const ensureDealThread = async (job) => {
    if (!job || !selectedThread || `${selectedThread.jobId || ''}` === `${job.id}`) {
      return selectedThread;
    }

    const response = await fetch(THREADS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        counterpartyId: selectedThread.participantId || undefined,
        counterpartyEmail: selectedThread.participantEmail || undefined,
        counterpartyRole: selectedThread.participantRoleValue || (currentUser?.role === 'client' ? 'freelancer' : 'client'),
        contract: job.title,
        jobId: job.id,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Could not open the project chat for this job.');
    }

    if (data.thread) {
      upsertThread(data.thread);
      return data.thread;
    }

    return selectedThread;
  };

  const handleDealAction = async (action) => {
    if (!token || !selectedThread?.id) return;

    if (dealLocked) {
      setStatus({ type: 'error', message: isVietnamese ? 'Công việc này đã hoàn tất. Mức giá thỏa thuận đã bị khóa.' : 'This job is completed. Deal price is locked.' });
      return;
    }

    const parsedAmount = parseMoneyAmount(dealAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setStatus({ type: 'error', message: isVietnamese ? 'Vui lòng nhập mức giá thỏa thuận hợp lệ.' : 'Please enter a valid deal price.' });
      return;
    }

    if (!relatedJob?.id || !dealMilestoneIndex) {
      setStatus({ type: 'error', message: isVietnamese ? 'Vui lòng chọn milestone trước khi cập nhật mức giá thỏa thuận.' : 'Please select a milestone before updating the deal price.' });
      return;
    }

    setDealSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const dealThread = await ensureDealThread(relatedJob);
      const response = await fetch(`${THREADS_URL}/${dealThread.id}/deal`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          amount: parsedAmount,
          jobId: relatedJob.id,
          milestoneIndex: Number(dealMilestoneIndex),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Could not update the deal price.');
      }

      if (data.thread) {
        upsertThread(data.thread, { select: true });
      }
      if (relatedJob?.id && typeof onDealUpdated === 'function') {
        const jobResponse = await fetch(`${API_BASE_URL}/jobs/${relatedJob.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const jobData = await jobResponse.json().catch(() => ({}));

        if (jobResponse.ok && jobData.job) {
          onDealUpdated(jobData.job);
        }
      }
      setDealPanelOpen(false);
      setStatus({ type: 'success', message: 'Successfully.' });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not update the deal price.',
      });
    } finally {
      setDealSaving(false);
    }
  };

  const selectedThreadMatchesDealJob = Boolean(
    selectedThread?.jobId
    && activeDealJobId
    && `${selectedThread.jobId}` === `${activeDealJobId}`,
  );
  const dealStatus = selectedThreadMatchesDealJob ? selectedThread?.deal?.status || 'none' : 'none';
  const isClient = currentUser?.role === 'client';
  const isFreelancer = currentUser?.role === 'freelancer';

  if (loading) {
    return (
      <SectionCard className="p-6">
        <p className="muted">Direct chat</p>
        <h2 className="mt-1 text-2xl font-bold text-ink">{isVietnamese ? 'Tin nhắn' : 'Messages'}</h2>
        <p className="mt-4 text-sm text-slate-500">{isVietnamese ? 'Đang tải cuộc trò chuyện...' : 'Loading chat threads...'}</p>
      </SectionCard>
    );
  }

  return (
    <div className="grid h-[calc(100vh-220px)] min-h-[520px] gap-6 overflow-hidden 2xl:grid-cols-[360px_minmax(0,1fr)]">
      <SectionCard className="flex min-h-0 flex-col overflow-hidden p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="muted">Direct chat</p>
            <h2 className="mt-1 text-2xl font-bold text-ink">{isVietnamese ? 'Tin nhắn' : 'Messages'}</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {threads.length} threads
          </span>
        </div>

        <label className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
              placeholder={isVietnamese ? 'Tìm cuộc trò chuyện' : 'Search chat'}
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleDeleteMode}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${deleteMode ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}
          >
            {deleteMode ? <X className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            {deleteMode ? (isVietnamese ? 'Thoát chọn xóa' : 'Exit delete mode') : (isVietnamese ? 'Chọn để xóa' : 'Select to delete')}
          </button>
          {deleteMode ? (
            <button
              type="button"
              onClick={handleDeleteSelectedThreads}
              disabled={deletingThreads || selectedThreadIds.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {deletingThreads
                ? (isVietnamese ? 'Đang xóa...' : 'Deleting...')
                : (isVietnamese ? `Xóa (${selectedThreadIds.length})` : `Delete (${selectedThreadIds.length})`)}
            </button>
          ) : null}
        </div>

        {status.message ? (
          <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${status.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {status.message}
          </p>
        ) : null}

        <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {visibleThreads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => {
                if (deleteMode) {
                  toggleThreadSelection(thread.id);
                  return;
                }
                setSelectedThreadId(thread.id);
              }}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                deleteMode
                  ? (selectedThreadIds.includes(thread.id)
                    ? 'border-rose-400 bg-rose-50/70'
                    : 'border-slate-200 bg-white hover:border-slate-300')
                  : thread.id === selectedThread?.id
                    ? 'border-indigo-500 bg-indigo-50/60'
                    : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{thread.participant}</p>
                  <p className="mt-1 text-sm text-slate-500">{thread.contract}</p>
                </div>
                <span className="text-xs font-medium text-slate-400">{thread.lastTime}</span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-600">{thread.lastMessage}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {thread.participantRole}
                </span>
                {deleteMode ? (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${selectedThreadIds.includes(thread.id) ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {selectedThreadIds.includes(thread.id) ? (isVietnamese ? 'Đã chọn' : 'Selected') : (isVietnamese ? 'Chọn' : 'Select')}
                  </span>
                ) : thread.unread ? (
                  <span className="rounded-full bg-coral px-2.5 py-1 text-xs font-semibold text-white">
                    {thread.unread}
                  </span>
                ) : null}
              </div>
            </button>
          ))}

          {visibleThreads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              {isVietnamese ? 'Chưa có cuộc trò chuyện nào.' : 'No conversations yet.'}
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard className="flex min-h-0 flex-col overflow-hidden p-0">
        {selectedThread ? (
          <>
            <div className="shrink-0 flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xl font-bold text-ink">{selectedThread.participant}</p>
                <p className="mt-1 text-sm text-slate-500">{selectedThread.contract}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (selectedThread.jobId) {
                    navigate(`/${currentUser?.role === 'client' ? 'client' : 'freelancer'}-jobs/${selectedThread.jobId}`);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {isVietnamese ? 'Mở hợp đồng' : 'Open contract'}
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.65),rgba(255,255,255,0.92))] px-6 py-6">
              {selectedThread.messages.map((message) => {
                const mine = message.senderId && currentUser?.id
                  ? String(message.senderId) === String(currentUser.id)
                  : message.senderName === userName;
                const senderInitial = (mine ? userName : message.senderName || '?')
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join('') || '?';
                return (
                  <div key={message.id} className={`flex w-full ${mine ? 'justify-end pl-12' : 'justify-start pr-12'}`}>
                    <div className={`flex max-w-[78%] items-end gap-3 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-bold ${mine ? 'bg-ink text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {senderInitial}
                      </div>
                      <div className={`rounded-[28px] px-4 py-3 shadow-sm ${mine ? 'rounded-br-md bg-ink text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'}`}>
                        <div className={`flex items-center gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                          <p className={`text-xs font-semibold ${mine ? 'text-white/70' : 'text-slate-500'}`}>
                            {mine ? (isVietnamese ? 'Bạn' : 'You') : message.senderName}
                          </p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${mine ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-500'}`}>
                            {message.senderRole}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-7">{message.text}</p>
                        <p className={`mt-3 text-xs ${mine ? 'text-white/60' : 'text-slate-400'}`}>{message.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="shrink-0 border-t border-slate-200 px-6 py-4">
              <div className="relative rounded-[28px] border border-slate-200 bg-slate-50 p-3">
                {dealPanelOpen ? (
                  <div className="absolute bottom-[92px] left-3 z-20 w-[min(720px,calc(100vw-3rem))] rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/12">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{isVietnamese ? 'Mức giá thỏa thuận' : 'Deal price'}</p>
                          <h3 className="text-lg font-bold text-ink">
                            {dealLocked ? (isVietnamese ? 'Giá đã bị khóa vì công việc hoàn tất' : 'Deal locked for completed job') : dealStatus === 'accepted' ? (isVietnamese ? 'Giá đã được chấp thuận' : 'Price accepted') : dealStatus === 'proposed' ? (isVietnamese ? 'Giá đang được thương lượng' : 'Price under negotiation') : (isVietnamese ? 'Tạo mức giá thỏa thuận' : 'Create deal price')}
                          </h3>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          dealLocked
                            ? 'bg-slate-200 text-slate-600'
                            : dealStatus === 'accepted'
                            ? 'bg-emerald-100 text-emerald-700'
                            : dealStatus === 'proposed'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {dealLocked ? 'locked' : dealStatus}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDealPanelOpen(false)}
                        className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        Close
                      </button>
                    </div>

                    {dealLocked ? (
                      <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                        {isVietnamese ? 'Công việc này đã hoàn tất nên không thể thương lượng lại giá milestone.' : 'This job is completed, so the milestone price can no longer be negotiated.'}
                      </p>
                    ) : null}

                    <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[240px_150px_minmax(0,1fr)]">
                      <label className="block min-w-0">
                        <span className="block whitespace-nowrap text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Job / Project</span>
                        <select
                          value={activeDealJobId}
                          onChange={(event) => {
                            setSelectedDealJobId(event.target.value);
                            setDealAmount('');
                            setDealMilestoneIndex('');
                          }}
                          disabled={dealJobOptions.length === 0}
                          className="mt-2 h-12 w-full truncate rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          <option value="">{dealJobOptions.length ? (isVietnamese ? 'Chọn công việc để thỏa thuận' : 'Select job to deal') : (isVietnamese ? 'Không có công việc khả dụng' : 'No available jobs')}</option>
                          {dealJobOptions.map((job) => (
                            <option key={job.id} value={job.id}>
                              {job.title} {job.status ? `- ${job.status}` : ''}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block min-w-0">
                        <span className="block whitespace-nowrap text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Amount</span>
                        <div className="mt-2 flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4">
                          <input
                            inputMode="numeric"
                            min="1"
                            value={dealAmount}
                            onChange={(event) => setDealAmount(event.target.value)}
                            disabled={dealLocked || (!isClient && !isFreelancer)}
                            placeholder="1200000"
                            className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                          />
                          <span className="font-bold text-slate-400">VND</span>
                        </div>
                      </label>
                      <label className="block min-w-0">
                        <span className="block whitespace-nowrap text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Milestone</span>
                        <select
                          value={dealMilestoneIndex}
                          onChange={(event) => setDealMilestoneIndex(event.target.value)}
                          disabled={dealLocked || (!isClient && !isFreelancer) || relatedMilestones.length === 0}
                          className="mt-2 h-12 w-full truncate rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          <option value="">{relatedMilestones.length ? 'Select milestone' : 'No linked milestones'}</option>
                          {relatedMilestones.map((milestone, index) => (
                            <option key={`${milestone.title}-${index}`} value={`${index}`}>
                              {milestone.title || `Milestone ${index + 1}`} {milestone.amount ? `(${milestone.amount})` : ''}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {isFreelancer && !dealLocked ? (
                        <button
                          type="button"
                          onClick={() => handleDealAction('propose')}
                          disabled={dealSaving}
                          className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <DollarSign className="h-4 w-4" />
                          {dealStatus === 'proposed' || dealStatus === 'accepted' ? (isVietnamese ? 'Cập nhật đề xuất' : 'Update proposal') : (isVietnamese ? 'Gửi mức giá' : 'Send price')}
                        </button>
                      ) : null}
                      {isClient && !dealLocked ? (
                        <>
                          {relatedJob?.id ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/client-jobs/${relatedJob.id}/edit`)}
                              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              <PencilLine className="h-4 w-4" />
                              Edit job post
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleDealAction(dealStatus === 'accepted' ? 'update' : 'accept')}
                            disabled={dealSaving}
                            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {dealStatus === 'accepted' ? <PencilLine className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            {dealStatus === 'accepted' ? (isVietnamese ? 'Sửa giá đã duyệt' : 'Edit accepted price') : (isVietnamese ? 'Duyệt mức giá' : 'Accept price')}
                          </button>
                          {dealStatus !== 'accepted' ? (
                            <button
                              type="button"
                              onClick={() => handleDealAction('update')}
                              disabled={dealSaving}
                              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <PencilLine className="h-4 w-4" />
                              Counter price
                            </button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={2}
                  placeholder={isVietnamese ? 'Nhập tin nhắn cho bên còn lại...' : 'Type a message to the other side...'}
                  className="w-full resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-slate-400"
                />
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900">
                      <Paperclip className="h-4 w-4" />
                      {isVietnamese ? 'Đính kèm tệp' : 'Attach file'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDealPanelOpen((open) => !open)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        dealPanelOpen
                          ? 'bg-emerald-600 text-white'
                          : 'text-emerald-700 hover:bg-white'
                      }`}
                    >
                      <DollarSign className="h-4 w-4" />
                      {isVietnamese ? 'Mức giá thỏa thuận' : 'Deal price'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || !draft.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <SendHorizonal className="h-4 w-4" />
                    {sending ? (isVietnamese ? 'Đang gửi...' : 'Sending...') : (isVietnamese ? 'Gửi' : 'Send')}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full min-h-0 flex-col items-center justify-center px-6 text-center">
            <p className="muted">Direct chat</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">No conversation selected yet</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
              {isVietnamese ? 'Chọn một cuộc trò chuyện trong danh sách bên trái để xem tin nhắn.' : 'Select a conversation from the list on the left to view messages.'}
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export default ChatPanel;
