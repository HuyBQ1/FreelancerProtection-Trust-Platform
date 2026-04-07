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

  return (
    <div className="grid gap-6 2xl:grid-cols-[360px_minmax(0,1fr)]">
      <SectionCard className="p-5">
        <div className="flex items-center justify-between">
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
          <input placeholder="Search chat" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
        </label>

        <div className="mt-5 space-y-3">
          {threads.map((thread) => (
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
        </div>
      </SectionCard>

      <SectionCard className="flex min-h-[680px] flex-col p-0">
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
      </SectionCard>
    </div>
  );
}

export default ChatPanel;
