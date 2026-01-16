import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const FAQ = [
  {
    keywords: ['как работает', 'как использовать', 'что такое'],
    answer: 'Наша платформа помогает рекрутерам и HR-специалистам получать рекомендации кандидатов за вознаграждение. Вы размещаете вакансию, указываете вознаграждение, и люди из вашей сети рекомендуют подходящих кандидатов.'
  },
  {
    keywords: ['создать вакансию', 'добавить вакансию', 'разместить'],
    answer: 'Чтобы создать вакансию, нажмите кнопку "+ Создать вакансию" на главной странице. Заполните информацию о должности, зарплате, требованиях и укажите размер вознаграждения за рекомендацию.'
  },
  {
    keywords: ['вознаграждение', 'выплата', 'деньги', 'оплата'],
    answer: 'Вознаграждение выплачивается после успешного найма рекомендованного кандидата. Срок выплаты указывается при создании вакансии (обычно через 30-90 дней после выхода кандидата на работу).'
  },
  {
    keywords: ['поделиться', 'отправить', 'распространить'],
    answer: 'Каждую вакансию можно поделиться через Telegram, ВКонтакте или WhatsApp. Нажмите на соответствующую кнопку под вакансией, чтобы отправить её в соцсети.'
  },
  {
    keywords: ['архив', 'закрыть', 'удалить'],
    answer: 'Вы можете отправить вакансию в архив кнопкой "Архив" или удалить её. Архивные вакансии можно восстановить в любой момент.'
  },
  {
    keywords: ['рекомендация', 'отклик', 'кандидат'],
    answer: 'Когда кто-то порекомендует кандидата, вы получите уведомление. Количество рекомендаций отображается на карточке вакансии значком с цифрой.'
  },
  {
    keywords: ['фильтр', 'поиск', 'найти'],
    answer: 'Используйте вкладки "Активные", "В архиве" и "Все" для фильтрации вакансий. Также есть поле поиска для быстрого нахождения нужной вакансии.'
  },
  {
    keywords: ['помощь', 'поддержка', 'вопрос'],
    answer: 'Если у вас остались вопросы, свяжитесь с нашей поддержкой через форму обратной связи или напишите нам на почту support@example.com'
  }
];

const INITIAL_MESSAGE: Message = {
  id: '0',
  text: 'Привет! 👋 Я помогу разобраться с возможностями сайта. Задайте вопрос о создании вакансий, вознаграждениях или работе с платформой.',
  sender: 'bot',
  timestamp: new Date()
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const findAnswer = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    for (const faq of FAQ) {
      if (faq.keywords.some(keyword => lowerQuestion.includes(keyword))) {
        return faq.answer;
      }
    }
    
    return 'Спасибо за вопрос! К сожалению, я не нашёл точного ответа. Попробуйте переформулировать вопрос или свяжитесь с нашей поддержкой для получения более детальной помощи.';
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: findAnswer(input),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        >
          <Icon name="MessageCircle" size={24} />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] flex flex-col shadow-2xl z-50 overflow-hidden">
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Icon name="Bot" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Помощник</h3>
                <p className="text-xs opacity-90">Онлайн</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 hover:bg-primary-foreground/20"
            >
              <Icon name="X" size={20} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p className="text-[10px] mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-background border rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Напишите ваш вопрос..."
                className="flex-1"
              />
              <Button onClick={handleSend} size="sm" disabled={!input.trim()}>
                <Icon name="Send" size={18} />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
