import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

const GPT_URL = 'https://functions.poehali.dev/13c7d269-1c74-4047-8fe9-92d9dc5c8cb4';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatBotProps {
  userRole?: 'employer' | 'employee' | 'guest';
}

const SYSTEM_PROMPT_EMPLOYER = `Ты — умный помощник платформы iHUNT (i-hunt.ru). Отвечай кратко, по делу, на русском языке.

iHUNT — реферальная HR-платформа для работодателей. Сотрудники компании рекомендуют знакомых на вакансии и получают денежное вознаграждение за успешный найм.

Возможности кабинета РАБОТОДАТЕЛЯ:
- Вакансии: создание, редактирование, архивирование, удаление. Для каждой вакансии задаётся зарплата, требования, описание, вознаграждение и срок выплаты (0–90 дней после выхода кандидата).
- Тесты: для каждой вакансии можно создать тест с помощью ИИ (кнопка "Тест" в карточке вакансии). Выбирается сложность (Лёгкий/Средний/Сложный) и количество вопросов (10/20/30). После генерации тест можно редактировать. Ссылку на тест отправляют кандидату.
- Рекомендации: просмотр всех рекомендаций от сотрудников, смена статуса (На рассмотрении → Принят → Вышел на работу / Отклонён). При принятии кандидата сотруднику начисляется вознаграждение в "ожидание выплаты".
- Команда: приглашение сотрудников по реферальной ссылке или QR-коду. Управление ролями (обычный/администратор), увольнение.
- Выплаты: просмотр и обработка запросов на выплату от сотрудников (одобрить / отклонить с комментарием / выплатить).
- Новости: публикация объявлений, достижений и новостей для всех сотрудников.
- Настройки компании: логотип, описание, сайт, соцсети, ИНН.
- Статистика: дашборд с ключевыми метриками компании.
- Уведомления: на email приходят уведомления о новых сотрудниках, рекомендациях и запросах на выплату.

Отвечай только на вопросы о платформе iHUNT. Если вопрос не по теме — вежливо предложи обратиться в поддержку: https://poehali.dev/help`;

const SYSTEM_PROMPT_EMPLOYEE = `Ты — умный помощник платформы iHUNT (i-hunt.ru). Отвечай кратко, по делу, на русском языке.

iHUNT — реферальная HR-платформа. Ты помогаешь СОТРУДНИКАМ компании.

Возможности кабинета СОТРУДНИКА:
- Вакансии: просмотр активных вакансий компании. По каждой — зарплата, вознаграждение, описание и требования. Можно поделиться вакансией через реферальную ссылку.
- Рекомендации: кнопка "Рекомендовать кандидата" открывает форму — ФИО, телефон, email, резюме, комментарий. После отправки рекомендация уходит HR-отделу. Статусы: На рассмотрении → Принят → Вышел на работу / Отклонён.
- Тесты: работодатель может создать тест для вакансии. Ссылку на тест можно отправить кандидату — он проходит тест, указывает ФИО и телефон, результат видит работодатель.
- Кошелёк: баланс (доступно к выводу) и ожидание (деньги заморожены до истечения срока). Можно создать запрос на выплату — выбрать сумму, способ (карта / СБП / расчётный счёт) и реквизиты.
- Рейтинг: уровень, очки опыта (+100 XP за каждого принятого кандидата), место среди коллег.
- Новости: объявления и новости от компании.
- Профиль: фото, телефон, Telegram, ВКонтакте.
- Уведомления в Telegram/MAX: бот присылает уведомления о статусах рекомендаций и выплатах.

Отвечай только на вопросы о платформе iHUNT. Если вопрос не по теме — вежливо предложи обратиться в поддержку: https://poehali.dev/help`;

const INITIAL_TEXT_EMPLOYER = 'Здравствуйте! 👋 Я помощник платформы iHUNT. Задайте вопрос о вакансиях, тестах, рекомендациях, выплатах или любой другой функции кабинета работодателя.';
const INITIAL_TEXT_EMPLOYEE = 'Привет! 👋 Я помощник платформы iHUNT. Спрашивайте о вакансиях, рекомендациях, кошельке, тестах и любых функциях личного кабинета.';

export default function ChatBot({ userRole = 'guest' }: ChatBotProps) {
  const systemPrompt = userRole === 'employer' ? SYSTEM_PROMPT_EMPLOYER : SYSTEM_PROMPT_EMPLOYEE;
  const initialText = userRole === 'employer' ? INITIAL_TEXT_EMPLOYER : INITIAL_TEXT_EMPLOYEE;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', text: initialText, sender: 'bot', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Формируем историю для GPT (последние 10 сообщений)
    const history = [...messages, userMsg]
      .filter(m => m.id !== '0')
      .slice(-10)
      .map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));

    try {
      const res = await fetch(`${GPT_URL}?action=generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...history,
          ],
          temperature: 0.6,
          max_tokens: 500,
        }),
      });
      const data = await res.json();
      const reply = data.content || 'Извините, не удалось получить ответ. Попробуйте ещё раз.';
      setMessages(prev => [...prev, { id: Date.now().toString(), text: reply, sender: 'bot', timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: 'Ошибка соединения. Проверьте интернет и попробуйте снова.',
        sender: 'bot',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
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
                <h3 className="font-semibold text-sm">Помощник iHUNT</h3>
                <p className="text-xs opacity-90">на базе ChatGPT</p>
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
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border'
                }`}>
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
                disabled={isTyping}
              />
              <Button onClick={handleSend} size="sm" disabled={!input.trim() || isTyping}>
                <Icon name="Send" size={18} />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
