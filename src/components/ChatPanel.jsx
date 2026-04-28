<<<<<<< HEAD
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, MessageSquarePlus, Paperclip, Search, SendHorizonal } from 'lucide-react';
import { io } from 'socket.io-client';
import SectionCard from './SectionCard';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const THREADS_URL = `${API_BASE_URL}/chat/threads`;
const TOKEN_KEY = 'fptp_token';
const SOCKET_URL = API_BASE_URL.replace(/\/api$/, '');

function ChatPanel({ currentUser, userName }) {
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatingThread, setCreatingThread] = useState(false);
  const [sending, setSending] = useState(false);
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

  const upsertThread = (nextThread) => {
    setThreads((current) => {
      const remaining = current.filter((thread) => thread.id !== nextThread.id);
      return [nextThread, ...remaining];
    });
    setSelectedThreadId(nextThread.id);
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

      setThreads(Array.isArray(data.threads) ? data.threads : []);
      if (!selectedThreadId && data.threads?.[0]?.id) {
        setSelectedThreadId(data.threads[0].id);
      }
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
        upsertThread(data.thread);
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
        upsertThread(data.thread);
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

  if (loading) {
    return (
      <SectionCard className="p-6">
        <p className="muted">Direct chat</p>
        <h2 className="mt-1 text-2xl font-bold text-ink">Messages</h2>
        <p className="mt-4 text-sm text-slate-500">Loading chat threads...</p>
      </SectionCard>
    );
  }
=======
import { useMemo, useState } from 'react';
import { ArrowUpRight, Paperclip, Search, SendHorizonal } from 'lucide-react';
import SectionCard from './SectionCard';

function ChatPanel({ userRole, userName, threads }) {
  const [selectedThreadId, setSelectedThreadId] = useState(threads[0]?.id ?? 1);
  const [draft, setDraft] = useState('');

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? threads[0],
    [selectedThreadId, threads],
  );

  const normalizedRole = userRole === 'client' ? 'client' : 'freelancer';
>>>>>>> origin/review

  return (
    <div className="grid gap-6 2xl:grid-cols-[360px_minmax(0,1fr)]">
      <SectionCard className="p-5">
<<<<<<< HEAD
        <div className="flex items-center justify-between gap-3">
=======
        <div className="flex items-center justify-between">
>>>>>>> origin/review
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
<<<<<<< HEAD
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
=======
          <input placeholder="Search chat" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
        </label>

        <div className="mt-5 space-y-3">
          {threads.map((thread) => (
>>>>>>> origin/review
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
<<<<<<< HEAD

          {visibleThreads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              No conversations yet. Click `Start conversation` to create your first chat thread.
            </div>
          ) : null}
=======
>>>>>>> origin/review
        </div>
      </SectionCard>

      <SectionCard className="flex min-h-[680px] flex-col p-0">
<<<<<<< HEAD
        {selectedThread ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xl font-bold text-ink">{selectedThread.participant}</p>
                <p className="mt-1 text-sm text-slate-500">{selectedThread.contract}</p>
              </div>
              <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                Open contract
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.65),rgba(255,255,255,0.92))] px-6 py-6">
              {selectedThread.messages.map((message) => {
                const mine = message.senderId && currentUser?.id
                  ? message.senderId === currentUser.id
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
=======
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xl font-bold text-ink">{selectedThread.participant}</p>
            <p className="mt-1 text-sm text-slate-500">{selectedThread.contract}</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            Open contract
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-auto px-6 py-6">
          {selectedThread.messages.map((message) => {
            const mine = message.senderRole === normalizedRole;
            return (
              <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-3xl px-4 py-3 ${mine ? 'bg-ink text-white' : 'bg-slate-100 text-slate-800'}`}>
                  <p className={`text-xs font-semibold ${mine ? 'text-white/70' : 'text-slate-500'}`}>{mine ? userName : message.senderName}</p>
                  <p className="mt-2 text-sm leading-6">{message.text}</p>
                  <p className={`mt-2 text-xs ${mine ? 'text-white/60' : 'text-slate-400'}`}>{message.time}</p>
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
                onClick={() => setDraft('')}
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <SendHorizonal className="h-4 w-4" />
                Send
              </button>
            </div>
          </div>
        </div>
>>>>>>> origin/review
      </SectionCard>
    </div>
  );
}

export default ChatPanel;
