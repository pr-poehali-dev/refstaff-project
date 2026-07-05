import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export function EmployeeHelpTab() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2 mb-2">
          <Icon name="HelpCircle" size={24} />
          <span>Помощь</span>
        </h2>
        <p className="text-muted-foreground">Краткий гид по разделам платформы</p>
      </div>

      <div className="grid gap-4">
        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Icon name="Newspaper" className="w-6 h-6 text-primary" /></div>
              <div>
                <CardTitle className="text-lg flex items-center gap-1.5"><Icon name="Megaphone" size={18} />Новости</CardTitle>
                <CardDescription className="mt-1">Лента событий компании</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2"><Icon name="ThumbsUp" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Лайк</strong> — нажмите сердечко на карточке новости</p></div>
            <div className="flex gap-2"><Icon name="MessageCircle" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Комментарий</strong> — кнопка с пузырьком открывает обсуждение новости</p></div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Icon name="Briefcase" className="w-6 h-6 text-primary" /></div>
              <div>
                <CardTitle className="text-lg flex items-center gap-1.5"><Icon name="Briefcase" size={18} />Вакансии</CardTitle>
                <CardDescription className="mt-1">Открытые позиции для рекомендаций</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2"><Icon name="UserPlus" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Рекомендовать</strong> — кнопка на карточке вакансии. Укажите ФИО, телефон кандидата и сопроводительное письмо</p></div>
            <div className="flex gap-2"><Icon name="Link" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Реферальная ссылка</strong> — скопируйте и отправьте знакомому, чтобы он сам оставил заявку</p></div>
            <div className="flex gap-2"><Icon name="Award" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Вознаграждение</strong> — размер бонуса и срок выплаты указаны на каждой карточке вакансии</p></div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Icon name="Star" className="w-6 h-6 text-primary" /></div>
              <div>
                <CardTitle className="text-lg flex items-center gap-1.5"><Icon name="Star" size={18} />Рекомендации</CardTitle>
                <CardDescription className="mt-1">История ваших кандидатов</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2"><Icon name="Filter" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Фильтр по статусу</strong> — переключайтесь между "Все", "На рассмотрении", "Принят", "Нанят", "Отклонён"</p></div>
            <div className="flex gap-2"><Icon name="ArrowRight" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Путь кандидата:</strong> На рассмотрении → Принят → На интервью → Нанят → вознаграждение зачислено</p></div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Icon name="Trophy" className="w-6 h-6 text-primary" /></div>
              <div>
                <CardTitle className="text-lg flex items-center gap-1.5"><Icon name="Trophy" size={18} />Рейтинг</CardTitle>
                <CardDescription className="mt-1">Ваш профиль, кошелёк и достижения</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2"><Icon name="Wallet" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Кошелёк</strong> — отображается прямо на этой вкладке. Кнопка "Запросить выплату" позволяет вывести средства на карту, СБП или расчётный счёт</p></div>
            <div className="flex gap-2"><Icon name="Medal" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Бейджи</strong> — зарабатывайте значки: "Острый глаз" (3 найма), "Рекрутер месяца" (5), "Золотой рекрутер" (10)</p></div>
            <div className="flex gap-2"><Icon name="BarChart3" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Место в рейтинге</strong> — ваша позиция среди коллег по числу успешных наймов</p></div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Icon name="Bell" className="w-6 h-6 text-primary" /></div>
              <div>
                <CardTitle className="text-lg flex items-center gap-1.5"><Icon name="Bell" size={18} />Уведомления</CardTitle>
                <CardDescription className="mt-1">Все важные события в одном месте</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2"><Icon name="Circle" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Новые уведомления</strong> — отмечены счётчиком на вкладке. Открытие вкладки сбрасывает счётчик</p></div>
            <div className="flex gap-2"><Icon name="Zap" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Типы:</strong> изменение статуса рекомендации, пополнение кошелька, новые вакансии, сообщения в чате</p></div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Icon name="CreditCard" className="w-6 h-6 text-primary" /></div>
              <div>
                <CardTitle className="text-lg flex items-center gap-1.5"><Icon name="CreditCard" size={18} />История</CardTitle>
                <CardDescription className="mt-1">Все транзакции по вашему кошельку</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2"><Icon name="Clock" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>В ожидании</strong> — вознаграждение зачислено, но ещё не разблокировано (идёт испытательный срок)</p></div>
            <div className="flex gap-2"><Icon name="CheckCircle2" className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" /><p><strong>Выплачено</strong> — средства перечислены на ваши реквизиты</p></div>
          </CardContent>
        </Card>

        <Card className="border-2 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon name="Lightbulb" className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Советы для успеха</CardTitle>
                <CardDescription className="mt-1">Как рекомендовать эффективно</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2">
              <Icon name="CheckCircle2" className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p><strong>Качество, а не количество:</strong> Рекомендуйте только тех, кто действительно соответствует требованиям вакансии</p>
            </div>
            <div className="flex gap-2">
              <Icon name="CheckCircle2" className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p><strong>Детальная информация:</strong> Чем больше полезных деталей о кандидате вы укажете, тем выше шанс на успех</p>
            </div>
            <div className="flex gap-2">
              <Icon name="CheckCircle2" className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p><strong>Предупредите кандидата:</strong> Убедитесь, что человек готов рассмотреть предложение, прежде чем его рекомендовать</p>
            </div>
            <div className="flex gap-2">
              <Icon name="CheckCircle2" className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p><strong>Будьте активны:</strong> Регулярно проверяйте новые вакансии — возможность заработать может появиться в любой момент</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default EmployeeHelpTab;