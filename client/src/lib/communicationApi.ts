import { api } from './api';
import type { ChatChannel, ChatMessage, CommunicationSummary } from '../types/phase9';

export const CHANNEL_TYPE_LABELS: Record<string, string> = {
  DEPARTMENT: 'Department',
  GENERAL: 'General',
  ANNOUNCEMENT: 'Announcement',
};

export const communicationApi = {
  summary: (token: string) => api.get<CommunicationSummary>('/communication/summary', token),
  channels: (token: string) => api.get<ChatChannel[]>('/communication/channels', token),
  messages: (token: string, channelId: string) =>
    api.get<ChatMessage[]>(`/communication/channels/${channelId}/messages`, token),
  sendMessage: (token: string, channelId: string, body: string) =>
    api.post<ChatMessage>(`/communication/channels/${channelId}/messages`, { body }, token),
};
