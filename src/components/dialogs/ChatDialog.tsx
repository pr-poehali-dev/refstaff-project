import { useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import type { ChatMessage } from '@/types';

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
  newMessage: string;
  onNewMessageChange: (msg: string) => void;
  selectedFiles: File[];
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (idx: number) => void;
  onSend: () => void;
}

export function ChatDialog({
  open,
  onOpenChange,
  messages,
  newMessage,
  onNewMessageChange,
  selectedFiles,
  onFileSelect,
  onRemoveFile,
  onSend,
}: ChatDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-16px)] max-w-2xl h-[92dvh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle className="text-base">Чат с HR отделом</DialogTitle>
          <DialogDescription className="text-xs">Задайте вопросы о рекомендациях и вакансиях</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-3 py-3 px-4 min-h-0">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${msg.isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg px-3 py-2`}>
                <div className="text-[10px] opacity-70 mb-1">{msg.senderName}</div>
                {msg.message && <div className="text-sm mb-1">{msg.message}</div>}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {msg.attachments.map((attachment, idx) => (
                      <div key={idx}>
                        {attachment.type === 'image' ? (
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="rounded max-w-full h-auto cursor-pointer hover:opacity-90 transition"
                            onClick={() => window.open(attachment.url, '_blank')}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <a
                            href={attachment.url}
                            download={attachment.name}
                            className={`flex items-center gap-2 p-2 rounded ${msg.isOwn ? 'bg-primary-foreground/10' : 'bg-background'} hover:opacity-80 transition`}
                          >
                            <Icon name="File" size={14} className="flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">{attachment.name}</div>
                              {attachment.size && (
                                <div className="text-[10px] opacity-70">{(attachment.size / 1024).toFixed(1)} KB</div>
                              )}
                            </div>
                            <Icon name="Download" size={12} className="flex-shrink-0" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-[10px] opacity-70 mt-1">{msg.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 pt-3 border-t px-4 pb-4 shrink-0">
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-muted px-2 py-1.5 rounded text-xs">
                  <Icon name={file.type.startsWith('image/') ? 'Image' : 'File'} size={12} />
                  <span className="max-w-[100px] truncate">{file.name}</span>
                  <button onClick={() => onRemoveFile(idx)} className="hover:text-destructive transition">
                    <Icon name="X" size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileSelect}
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-10 flex-shrink-0"
            >
              <Icon name="Paperclip" size={16} />
            </Button>
            <Input
              placeholder="Сообщение..."
              value={newMessage}
              onChange={(e) => onNewMessageChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
              className="text-sm h-10"
            />
            <Button onClick={onSend} className="h-10 w-10 p-0 flex-shrink-0">
              <Icon name="Send" size={16} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
