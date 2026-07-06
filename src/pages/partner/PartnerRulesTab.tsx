import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

export default function PartnerRulesTab() {
  return (
    <TabsContent value="rules" className="mt-3 space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon name="FileText" size={18} className="text-primary" />
            Правила партнёрской программы
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { icon: 'Link', text: 'Партнёр получает уникальную реферальную ссылку сразу после регистрации в программе.' },
            { icon: 'UserCheck', text: 'Компания, зарегистрировавшаяся по ссылке партнёра, закрепляется за ним навсегда.' },
            { icon: 'FileSignature', text: 'Договор с партнёром заключается после того, как первый приведённый им клиент оплатил подписку.' },
            { icon: 'Percent', text: 'Вознаграждение — 50% от суммы оплаты: за первые 3 ежемесячных платежа клиента или разово 50% от стоимости годовой подписки.' },
            { icon: 'Clock', text: 'Начисленная комиссия становится доступна к выводу после 30-дневного hold-периода (защита от возвратов и отмен подписки).' },
            { icon: 'Headset', text: 'Вывод средств осуществляется по запросу в техподдержку — самостоятельный автоматический вывод недоступен. Заявка обрабатывается вручную.' },
            { icon: 'ShieldAlert', text: 'Партнёрская программа не распространяется на самостоятельную регистрацию собственной компании партнёра по своей же ссылке.' },
            { icon: 'RefreshCw', text: 'Если клиент отменяет подписку или возвращает оплату до истечения hold-периода, комиссия по этой оплате аннулируется.' },
          ].map((r, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/50">
              <Icon name={r.icon} size={16} className="text-primary mt-0.5 shrink-0" />
              <p className="text-sm">{r.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4 pb-4 flex items-center gap-3">
          <Icon name="HeadphonesIcon" size={24} className="text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-sm">Хотите вывести средства?</p>
            <p className="text-xs text-muted-foreground">Напишите в техподдержку — заявку на вывод обработают вручную.</p>
          </div>
          <a
            href="https://t.me/ihunt_support"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-primary underline whitespace-nowrap"
          >
            Написать
          </a>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
