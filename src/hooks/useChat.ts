import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import type { Chat } from '@/lib/api';
import type { ChatMessage, Employee } from '@/types';

export function useChat(params: {
  userRole: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentUser: any;
  currentEmployeeId: number;
  currentCompanyId: number;
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  setUnreadMessagesCount: React.Dispatch<React.SetStateAction<number>>;
}) {
  const {
    userRole,
    currentUser,
    currentCompanyId,
    chats,
    setChats,
    setUnreadMessagesCount,
  } = params;

  // --- State ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [activeChatEmployee, setActiveChatEmployee] = useState<Employee | null>(null);
  const [showChatDialog, setShowChatDialog] = useState(false);

  // --- Refs ---
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Constants ---
  const MAX_FILE_SIZE_MB = 4;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  // --- Helpers ---
  const compressImage = (file: File, maxSizeMB = 3): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 1600;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        let quality = 0.85;
        const tryEncode = () => {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const bytes = (dataUrl.length * 3) / 4;
          if (bytes > maxSizeMB * 1024 * 1024 && quality > 0.4) {
            quality -= 0.1;
            tryEncode();
          } else {
            resolve(dataUrl.split(',')[1]);
          }
        };
        tryEncode();
      };
      img.onerror = reject;
      img.src = url;
    });

  // --- Functions ---
  const loadChatMessages = async (chatId: number) => {
    try {
      const msgs = await api.getMessages(chatId, currentUser?.id);
      const mapped: ChatMessage[] = msgs.map((m) => ({
        id: m.id,
        senderId: m.sender_id,
        senderName: m.sender_name || 'Сотрудник',
        message: m.message,
        timestamp: new Date(m.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        createdAt: m.created_at,
        isOwn: m.sender_id === currentUser?.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attachments: (m as any).attachment_url ? [{
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: (m as any).attachment_type as 'image' | 'file',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          url: (m as any).attachment_url,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name: (m as any).attachment_name || 'файл',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          size: (m as any).attachment_size || 0,
        }] : undefined,
      }));
      setChatMessages(mapped);
      setTimeout(() => chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  };

  const handleSelectChatEmployee = async (emp: Employee) => {
    setActiveChatEmployee(emp);
    setChatMessages([]);
    setActiveChatId(null);
    try {
      const chat = await api.createChat(currentCompanyId || 0, emp.id);
      const chatId = Number(chat.chat_id || chat.id);
      if (!chatId) { console.error('No chatId returned', chat); return; }
      setActiveChatId(chatId);
      await loadChatMessages(chatId);
      if (currentUser?.id) {
        api.markMessagesRead(chatId, currentUser.id);
        setChats(prev => prev.map(c => (c.id === chatId || c.chat_id === chatId) ? { ...c, unread_count: 0 } : c));
        setUnreadMessagesCount(prev => {
          const chatUnread = chats.find(c => c.id === chatId || c.chat_id === chatId)?.unread_count || 0;
          return Math.max(0, prev - chatUnread);
        });
      }
      if (chatPollRef.current) clearInterval(chatPollRef.current);
      chatPollRef.current = setInterval(() => loadChatMessages(chatId), 5000);
    } catch (e) {
      console.error('Failed to open chat:', e);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !activeChatId || isSendingMessage) return;
    setIsSendingMessage(true);
    try {
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          let base64: string;
          let mime_type = file.type;

          if (file.type.startsWith('image/')) {
            base64 = await compressImage(file);
            mime_type = 'image/jpeg';
          } else {
            base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve((reader.result as string).split(',')[1]);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          }

          await api.sendMessage(activeChatId, currentUser?.id || 0, newMessage.trim(), {
            base64,
            name: file.name,
            mime_type,
          });
        }
      } else {
        await api.sendMessage(activeChatId, currentUser?.id || 0, newMessage.trim());
      }
      setNewMessage('');
      setSelectedFiles([]);
      await loadChatMessages(activeChatId);
    } catch (e) {
      console.error('Failed to send message:', e);
      alert('Не удалось отправить файл. Попробуйте файл меньшего размера.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const tooBig = files.filter(f => f.size > MAX_FILE_SIZE_BYTES);
    if (tooBig.length > 0) {
      alert(`Файл "${tooBig[0].name}" слишком большой. Максимальный размер — ${MAX_FILE_SIZE_MB} МБ.`);
      e.target.value = '';
      return;
    }
    setSelectedFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleOpenChat = async () => {
    setShowChatDialog(true);
    setUnreadMessagesCount(0);
    if (userRole === 'employee' && currentUser?.id && currentCompanyId) {
      setChatMessages([]);
      setActiveChatId(null);
      try {
        const chat = await api.createChat(currentCompanyId, currentUser.id);
        const chatId = Number(chat.chat_id || chat.id);
        if (!chatId) return;
        setActiveChatId(chatId);
        await loadChatMessages(chatId);
        api.markMessagesRead(chatId, currentUser.id);
        if (chatPollRef.current) clearInterval(chatPollRef.current);
        chatPollRef.current = setInterval(() => loadChatMessages(chatId), 5000);
      } catch (e) {
        console.error('Failed to open employee chat:', e);
      }
    }
  };

  // useEffect #4 — chat dialog effect
  useEffect(() => {
    if (showChatDialog && activeChatEmployee && userRole === 'employer') {
      handleSelectChatEmployee(activeChatEmployee);
    }
    if (!showChatDialog && chatPollRef.current) {
      clearInterval(chatPollRef.current);
      chatPollRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showChatDialog, activeChatEmployee?.id]);

  return {
    chatMessages, setChatMessages,
    newMessage, setNewMessage,
    selectedFiles, setSelectedFiles,
    activeChatId, setActiveChatId,
    isSendingMessage,
    activeChatEmployee, setActiveChatEmployee,
    showChatDialog, setShowChatDialog,
    chatMessagesEndRef,
    fileInputRef,
    loadChatMessages,
    handleSelectChatEmployee,
    handleSendMessage,
    handleFileSelect,
    removeFile,
    handleOpenChat,
  };
}