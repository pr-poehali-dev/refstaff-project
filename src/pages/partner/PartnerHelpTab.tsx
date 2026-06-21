import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

export default function PartnerHelpTab() {
  return (
    <TabsContent value="help" className="mt-3 space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon name="Rocket" size={18} className="text-primary" />
            Как работает партнёрская программа
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { step: '1', title: 'Поделитесь реферальной ссылкой', desc: 'Отправьте свою уникальную ссылку потенциальному клиенту — компании, которая ищет сотрудников.' },
            { step: '2', title: 'Клиент регистрируется', desc: 'Компания регистрируется на iHUNT по вашей ссылке и автоматически привязывается к вам.' },
            { step: '3', title: 'Клиент оплачивает подписку', desc: 'Вы получаете 50% за первые 3 ежемесячных платежа или 50% от полной стоимости годовой подписки — разово.' },
            { step: '4', title: 'Получаете выплату', desc: 'После 30-дневного hold-периода деньги становятся доступны к выводу на карту или расчётный счёт.' },
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{s.step}</div>
              <div>
                <p className="font-medium text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon name="Lightbulb" size={18} className="text-yellow-500" />
            Советы по привлечению клиентов
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { icon: 'Target', text: 'Ориентируйтесь на компании от 20 сотрудников — у них есть бюджет на HR-инструменты.' },
            { icon: 'MessageCircle', text: 'Расскажите клиенту о конкретной выгоде: сотрудники сами рекомендуют кандидатов, нет затрат на рекрутёра.' },
            { icon: 'Share2', text: 'Делитесь ссылкой в деловых чатах, на LinkedIn, в отраслевых сообществах.' },
            { icon: 'UserPlus', text: 'Добавляйте «тёплых» клиентов вручную — если договорились лично, не забудьте зафиксировать контакт.' },
            { icon: 'RefreshCw', text: 'Напоминайте существующим клиентам о продлении подписки — вы снова получите комиссию.' },
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
              <Icon name={tip.icon} size={16} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs">{tip.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon name="HelpCircle" size={18} className="text-blue-500" />
            Частые вопросы
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { q: 'Когда деньги становятся доступны?', a: 'После 30-дневного hold-периода с момента оплаты подписки клиентом. Это защита от возвратов.' },
            { q: 'Что такое «На удержании»?', a: 'Комиссия, которая уже начислена, но ещё не прошла hold-период. Скоро появится на балансе.' },
            { q: 'За сколько платежей я получаю комиссию?', a: 'За первые 3 ежемесячных платежа (по 9 950 ₽ каждый). Если клиент оплатил сразу год — вы получаете 50% от годовой стоимости (101 490 ₽) единоразово, после чего лимит исчерпан.' },
            { q: 'Как долго клиент «привязан» ко мне?', a: 'Навсегда. Один раз зарегистрировавшись по вашей ссылке, компания остаётся вашим клиентом.' },
            { q: 'Есть ли минимальная сумма для вывода?', a: 'Вывод доступен при любом положительном балансе. Минимальной суммы нет.' },
          ].map((faq, i) => (
            <div key={i} className="border-b last:border-0 pb-3 last:pb-0">
              <p className="font-medium text-sm">{faq.q}</p>
              <p className="text-xs text-muted-foreground mt-1">{faq.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4 pb-4 flex items-center gap-3">
          <Icon name="HeadphonesIcon" size={24} className="text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-sm">Нужна помощь?</p>
            <p className="text-xs text-muted-foreground">Напишите нам — ответим в течение рабочего дня.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => window.open('https://t.me/ihunt_support', '_blank')}>
            <Icon name="Send" size={14} className="mr-1" />Telegram
          </Button>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
