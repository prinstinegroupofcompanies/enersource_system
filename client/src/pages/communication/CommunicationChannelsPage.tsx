import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { communicationApi, CHANNEL_TYPE_LABELS } from '../../lib/communicationApi';
import type { ChatChannel, ChatMessage } from '../../types/phase9';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function CommunicationChannelsPage() {
  const { accessToken, hasPermission } = useAuth();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');

  const loadChannels = () => {
    if (!accessToken) return;
    communicationApi.channels(accessToken).then((list) => {
      setChannels(list);
      if (!activeId && list[0]) setActiveId(list[0].id);
    });
  };

  const loadMessages = (channelId: string) => {
    if (!accessToken) return;
    communicationApi.messages(accessToken, channelId).then(setMessages);
  };

  useEffect(() => {
    loadChannels();
  }, [accessToken]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [accessToken, activeId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !activeId || !text.trim()) return;
    await communicationApi.sendMessage(accessToken, activeId, text.trim());
    setText('');
    loadMessages(activeId);
    loadChannels();
  };

  const active = channels.find((c) => c.id === activeId);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <ul className="divide-y divide-slate-50">
          {channels.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`w-full px-1 py-3 text-left transition-colors ${
                  activeId === c.id ? 'bg-brand-50' : 'hover:bg-slate-50'
                }`}
              >
                <p className="font-semibold text-slate-800">{c.name}</p>
                <p className="text-xs text-slate-500">
                  {CHANNEL_TYPE_LABELS[c.type] ?? c.type}
                  {c.department ? ` · ${c.department.name}` : ''}
                </p>
                {c.lastMessage ? (
                  <p className="mt-1 truncate text-xs text-slate-400">{c.lastMessage.body}</p>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="flex min-h-[420px] flex-col lg:col-span-2" title={active?.name ?? 'Select a channel'}>
        <div className="flex flex-1 flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto py-2">
            {messages.map((m) => (
              <div key={m.id} className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-xs font-semibold text-brand-800">
                  {m.sender.firstName} {m.sender.lastName}
                  <span className="ml-2 font-normal text-slate-400">
                    {new Date(m.createdAt).toLocaleString()}
                  </span>
                </p>
                <p className="mt-1 text-sm text-slate-700">{m.body}</p>
              </div>
            ))}
            {!messages.length ? <p className="text-sm text-slate-500">No messages yet.</p> : null}
          </div>
          {hasPermission('communication', 'create') ? (
            <form onSubmit={send} className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
              <Input
                placeholder="Write a message…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
