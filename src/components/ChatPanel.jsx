import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, DollarSign, MessageSquarePlus, Paperclip, PencilLine, Search, SendHorizonal } from 'lucide-react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import SectionCard from './SectionCard';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const THREADS_URL = `${API_BASE_URL}/chat/threads`;
const TOKEN_KEY = 'fptp_token';
const SOCKET_URL = API_BASE_URL.replace(/\/api$/, '');

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
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatingThread, setCreatingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [dealAmount, setDealAmount] = useState('');
  const [dealMilestoneIndex, setDealMilestoneIndex] = useState('');
  const [selectedDealJobId, setSelectedDealJobId] = useState('');
  const [dealSaving, setDealSaving] = useState(false);
  const [dealJobs, setDealJobs] = useState([]);
  const [relatedJobDetails, setRelatedJobDetails] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });

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
        throw new Error(data.message || 'Could not load chat threads.');
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
        message: error instanceof Error ? error.message : 'Could not load chat threads.',
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

  const handleCreateThread = async () => {
    if (!token) return;

    setCreatingThread(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch(THREADS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Could not create a chat thread.');
      }

      if (data.thread) {
        upsertThread(data.thread, { select: true });
        setStatus({ type: 'success', message: 'Successfully.' });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not create a chat thread.',
      });
    } finally {
      setCreatingThread(false);
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
        throw new Error(data.message || 'Could not send the message.');
      }

      if (data.thread) {
        upsertThread(data.thread, { select: true });
      }
      setDraft('');
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not send the message.',
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
      setStatus({ type: 'error', message: 'This job is completed. Deal price is locked.' });
      return;
    }

    const parsedAmount = Number(dealAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setStatus({ type: 'error', message: 'Please enter a valid deal price.' });
      return;
    }

    if (!relatedJob?.id || !dealMilestoneIndex) {
      setStatus({ type: 'error', message: 'Please select a milestone before updating the deal price.' });
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
        <h2 className="mt-1 text-2xl font-bold text-ink">Messages</h2>
        <p className="mt-4 text-sm text-slate-500">Loading chat threads...</p>
      </SectionCard>
    );
  }

  return (
    <div className="grid gap-6 2xl:grid-cols-[360px_minmax(0,1fr)]">
      <SectionCard className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="muted">Direct chat</p>
            <h2 className="mt-1 text-2xl font-bold text-ink">Messages</h2>
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
            placeholder="Search chat"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </label>

        <button
          type="button"
          onClick={handleCreateThread}
          disabled={creatingThread}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <MessageSquarePlus className="h-4 w-4" />
          {creatingThread ? 'Creating...' : 'Start conversation'}
        </button>

        {status.message ? (
          <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${status.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {status.message}
          </p>
        ) : null}

        <div className="mt-5 space-y-3">
          {visibleThreads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setSelectedThreadId(thread.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                thread.id === selectedThread?.id
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
                {thread.unread ? (
                  <span className="rounded-full bg-coral px-2.5 py-1 text-xs font-semibold text-white">
                    {thread.unread}
                  </span>
                ) : null}
              </div>
            </button>
          ))}

          {visibleThreads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              No conversations yet. Click `Start conversation` to create your first chat thread.
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard className="flex min-h-[680px] flex-col p-0">
        {selectedThread ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
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
                Open contract
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-5">
              <div className="min-h-[238px] space-y-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Deal price</p>
                      <h3 className="text-xl font-bold text-ink">
                        {dealLocked ? 'Deal locked for completed job' : dealStatus === 'accepted' ? 'Price accepted by client' : dealStatus === 'proposed' ? 'Price under negotiation' : 'No price proposed yet'}
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

                  <p className={`mt-4 min-h-[46px] rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    dealLocked
                      ? 'border-slate-200 bg-white text-slate-600 opacity-100'
                      : 'border-transparent bg-transparent text-transparent opacity-0'
                  }`}>
                    This job is completed, so the milestone price can no longer be negotiated.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[240px_180px_260px]">
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
                        className="mt-2 h-13 w-full truncate rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">{dealJobOptions.length ? 'Select job to deal' : 'No available jobs'}</option>
                        {dealJobOptions.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.title} {job.status ? `- ${job.status}` : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block min-w-0">
                      <span className="block whitespace-nowrap text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Amount</span>
                      <div className="mt-2 flex h-13 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <span className="font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          min="1"
                          value={dealAmount}
                          onChange={(event) => setDealAmount(event.target.value)}
                          disabled={dealLocked || (!isClient && !isFreelancer)}
                          placeholder="1200"
                          className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </label>
                    <label className="block min-w-0">
                      <span className="block whitespace-nowrap text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Milestone</span>
                      <select
                        value={dealMilestoneIndex}
                        onChange={(event) => setDealMilestoneIndex(event.target.value)}
                        disabled={dealLocked || (!isClient && !isFreelancer) || relatedMilestones.length === 0}
                        className="mt-2 h-13 w-full truncate rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
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
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isFreelancer && !dealLocked ? (
                    <button
                      type="button"
                      onClick={() => handleDealAction('propose')}
                      disabled={dealSaving}
                      className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <DollarSign className="h-4 w-4" />
                      {dealStatus === 'proposed' || dealStatus === 'accepted' ? 'Update proposal' : 'Send price'}
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
                        {dealStatus === 'accepted' ? 'Edit accepted price' : 'Accept price'}
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
            </div>

            <div className="flex-1 space-y-5 overflow-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.65),rgba(255,255,255,0.92))] px-6 py-6">
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
                            {mine ? 'You' : message.senderName}
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

            <div className="border-t border-slate-200 px-6 py-5">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-3">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={3}
                  placeholder="Type a message to the other side..."
                  className="w-full resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-slate-400"
                />
                <div className="mt-3 flex items-center justify-between">
                  <button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900">
                    <Paperclip className="h-4 w-4" />
                    Attach file
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || !draft.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <SendHorizonal className="h-4 w-4" />
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-[680px] flex-col items-center justify-center px-6 text-center">
            <p className="muted">Direct chat</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">No conversation selected yet</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
              Start a conversation to create the first client and freelancer chat thread in MongoDB.
            </p>
            <button
              type="button"
              onClick={handleCreateThread}
              disabled={creatingThread}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MessageSquarePlus className="h-4 w-4" />
              {creatingThread ? 'Creating...' : 'Start conversation'}
            </button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export default ChatPanel;
