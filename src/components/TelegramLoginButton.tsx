import { useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface Props {
  onAuth: (user: TelegramUser) => void;
  loading?: boolean;
}

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '';

export function TelegramLoginButton({ onAuth, loading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!BOT_USERNAME || !containerRef.current) return;

    window.onTelegramAuth = onAuth;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [onAuth]);

  if (!BOT_USERNAME) {
    return (
      <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center">
        <Icon name="AlertCircle" size={16} className="inline mr-1" />
        Telegram бот не настроен. Обратитесь к администратору.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
        <Icon name="Loader2" size={18} className="animate-spin" />
        Выполняем вход...
      </div>
    );
  }

  return <div ref={containerRef} className="flex justify-center" />;
}

export default TelegramLoginButton;
