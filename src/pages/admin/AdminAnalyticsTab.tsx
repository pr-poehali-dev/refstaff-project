import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Analytics } from './adminTypes';

interface Props {
  analytics: Analytics | null;
}

export default function AdminAnalyticsTab({ analytics }: Props) {
  return (
    <TabsContent value="analytics">
      {analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Компаний', value: analytics.companies_total, icon: 'Building2', color: 'text-blue-400' },
              { label: 'Пользователей', value: analytics.users_total, icon: 'Users', color: 'text-green-400' },
              { label: 'Вакансий', value: analytics.vacancies_total, icon: 'Briefcase', color: 'text-yellow-400' },
              { label: 'Рекомендаций', value: analytics.recommendations_total, icon: 'ThumbsUp', color: 'text-purple-400' },
            ].map(s => (
              <Card key={s.label} className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 text-sm">{s.label}</span>
                    <Icon name={s.icon as any} size={18} className={s.color} />
                  </div>
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-1">Активных подписок</p>
                <p className="text-2xl font-bold text-green-400">{analytics.active_subscriptions}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-1">Истекших подписок</p>
                <p className="text-2xl font-bold text-red-400">{analytics.expired_subscriptions}</p>
              </CardContent>
            </Card>
          </div>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="text-white text-base">Регистрации за 30 дней</CardTitle></CardHeader>
            <CardContent>
              {analytics.registrations_by_day.length === 0
                ? <p className="text-gray-400 text-sm">Нет данных</p>
                : <div className="space-y-2">
                    {analytics.registrations_by_day.map(r => (
                      <div key={r.date} className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm w-24">{new Date(r.date).toLocaleDateString('ru-RU')}</span>
                        <div className="flex-1 bg-gray-800 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, r.count * 20)}%` }} />
                        </div>
                        <span className="text-white text-sm w-6 text-right">{r.count}</span>
                      </div>
                    ))}
                  </div>
              }
            </CardContent>
          </Card>
        </div>
      )}
    </TabsContent>
  );
}
