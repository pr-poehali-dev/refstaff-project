import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Notification {
  id: number;
  type: string;
  message: string;
  date: string;
  read: boolean;
}

interface NotificationsTabProps {
  notifications: Notification[];
  userRole: string;
  onMarkRead: (id: number) => void;
}

export function NotificationsTab({ notifications, userRole, onMarkRead }: NotificationsTabProps) {
  const filtered = notifications.filter(n => {
    if (userRole === 'employee') {
      return n.type !== 'subscription';
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
        <Icon name="Bell" size={20} />
        <span>Уведомления</span>
      </h2>
      <div className="space-y-2 sm:space-y-3">
        {filtered.map((notif) => (
          <Card
            key={notif.id}
            className={`transition-opacity cursor-pointer hover:shadow-sm ${notif.read ? 'opacity-60' : ''}`}
            onClick={() => {
              if (!notif.read) {
                onMarkRead(notif.id);
              }
            }}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${
                  notif.type === 'recommendation' ? 'bg-blue-100' :
                  notif.type === 'hire' ? 'bg-green-100' :
                  notif.type === 'payout' ? 'bg-yellow-100' :
                  notif.type === 'wallet' ? 'bg-purple-100' :
                  notif.type === 'chat' ? 'bg-teal-100' :
                  notif.type === 'vacancy' ? 'bg-orange-100' :
                  'bg-gray-100'
                }`}>
                  <Icon
                    name={
                      notif.type === 'recommendation' ? 'UserPlus' :
                      notif.type === 'hire' ? 'CheckCircle' :
                      notif.type === 'payout' ? 'DollarSign' :
                      notif.type === 'wallet' ? 'Wallet' :
                      notif.type === 'chat' ? 'MessageSquare' :
                      notif.type === 'vacancy' ? 'Briefcase' :
                      'Bell'
                    }
                    size={16}
                    className={
                      notif.type === 'recommendation' ? 'text-blue-600' :
                      notif.type === 'hire' ? 'text-green-600' :
                      notif.type === 'payout' ? 'text-yellow-600' :
                      notif.type === 'wallet' ? 'text-purple-600' :
                      notif.type === 'chat' ? 'text-teal-600' :
                      notif.type === 'vacancy' ? 'text-orange-600' :
                      'text-gray-600'
                    }
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm">{notif.message}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    {new Date(notif.date).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {!notif.read ? (
                  <Badge variant="default" className="text-[10px] sm:text-xs flex-shrink-0">Новое</Badge>
                ) : (
                  <Icon name="Check" size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Icon name="Bell" size={48} className="mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Нет уведомлений</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default NotificationsTab;