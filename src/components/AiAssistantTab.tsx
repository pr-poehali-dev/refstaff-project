import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const AI_URL = 'https://functions.poehali.dev/38fa8429-a587-412d-83f1-e606f3c71fbc';

const SUGGESTIONS = [
  'Сколько активных вакансий?',
  'Кто лучший рекрутёр в команде?',
  'Сколько рекомендаций на рассмотрении?',
  'Как пригласить сотрудника?',
  'Какая общая сумма вознаграждений?',
  'Как настроить выплаты?',
];

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

type Message = AiMessage;

interface Props {
  companyId: number;
  messages: Message[];
  setMessages: (msgs: Message[] | ((prev: Message[]) => Message[])) => void;
}

export default function AiAssistantTab({ companyId, messages, setMessages }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    try { localStorage.setItem('ai_chat_history', JSON.stringify(messages.slice(-50))); } catch (e) { /* ignore */ }
  }, [messages]);

  const send = async (question: string) => {
    if (!question.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: question.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          company_id: companyId,
          history: messages.slice(-6),
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer || 'Не удалось получить ответ.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Произошла ошибка. Попробуйте ещё раз.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] max-h-[700px]">
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
          <Icon name="Bot" size={22} /> ИИ-помощник
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Знает данные вашей компании и платформу iHUNT. Спросите что угодно.
        </p>
      </div>

      {/* История сообщений */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center py-4">
              Начните диалог или выберите вопрос ниже
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 text-sm">
                <Icon name="Bot" size={16} />
              </div>
            )}
            <Card className={`max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <CardContent className="p-3 text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </CardContent>
            </Card>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 text-sm">
              <Icon name="Bot" size={16} />
            </div>
            <Card className="bg-muted">
              <CardContent className="p-3 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
              </CardContent>
            </Card>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Поле ввода */}
      <div className="mt-3 flex gap-2 pt-3 border-t">
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-10 w-10"
            onClick={() => { setMessages([]); try { localStorage.removeItem('ai_chat_history'); } catch (e) { /* ignore */ } }}
            title="Очистить диалог"
          >
            <Icon name="Trash2" size={16} className="text-muted-foreground" />
          </Button>
        )}
        <Input
          placeholder="Задайте вопрос..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
          disabled={loading}
          className="flex-1"
        />
        <Button onClick={() => send(input)} disabled={loading || !input.trim()} className="shrink-0">
          <Icon name="Send" size={16} />
        </Button>
      </div>
    </div>
  );
}