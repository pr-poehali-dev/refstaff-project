import React from 'react';
import AiAssistantTab, { type AiMessage } from '@/components/AiAssistantTab';

export interface AiAssistantTabWrapperProps {
  companyId: number;
  messages: AiMessage[];
  setMessages: (msgs: AiMessage[]) => void;
}

export function AiAssistantTabWrapper({ companyId, messages, setMessages }: AiAssistantTabWrapperProps) {
  return (
    <AiAssistantTab companyId={companyId} messages={messages} setMessages={setMessages} />
  );
}

export default AiAssistantTabWrapper;
