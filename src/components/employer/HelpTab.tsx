import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export function HelpTab() {
  return (
    <>
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
              <div className="p-2 bg-primary/10 rounded-lg"><Icon name="Briefcase" className="w-6 h-6 text-primary" /></div>
              <div>
                <CardTitle className="text-lg flex items-center gap-1.5"> Вакансии</CardTitle>
                <CardDescription className="mt-1">Управление открытыми позициями</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2"><Icon name="Plus" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Создать вакансию</strong> — кнопка в правом верхнем углу. Укажите должность, зарплату, отдел, город и размер вознаграждения для сотрудника</p></div>
            <div className="flex gap-2"><Icon name="Pencil" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Редактировать / архивировать</strong> — иконки карандаша и архива справа на карточке вакансии</p></div>
            <div className="flex gap-2"><Icon name="Eye" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Кандидаты</strong> — нажмите на вакансию, чтобы увидеть всех рекомендованных кандидатов и их статусы</p></div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Icon name="Users" className="w-6 h-6 text-primary" /></div>
              <div>
                <CardTitle className="text-lg flex items-center gap-1.5">Сотрудники</CardTitle>
                <CardDescription className="mt-1">Управление командой</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2"><Icon name="Link" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Пригласить сотрудника</strong> — сгенерируйте реферальную ссылку и отправьте сотруднику для регистрации</p></div>
            <div className="flex gap-2"><Icon name="Shield" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Роли</strong> — иконка щита позволяет назначить сотруднику права администратора</p></div>
            <div className="flex gap-2"><Icon name="UserX" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Уволить / восстановить</strong> — доступно через меню управления ролями сотрудника</p></div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Icon name="Target" className="w-6 h-6 text-primary" /></div>
              <div>
                <CardTitle className="text-lg flex items-center gap-1.5">Рекомендации</CardTitle>
                <CardDescription className="mt-1">Отслеживание кандидатов</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2"><Icon name="Check" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Принять / отклонить</strong> — кнопки на карточке кандидата меняют его статус</p></div>
            <div className="flex gap-2"><Icon name="Clock" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Выплата</strong> — после принятия кандидата запускается таймер выплаты вознаграждения сотруднику</p></div>
            <div className="flex gap-2"><Icon name="Filter" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Фильтрация</strong> — используйте поиск и фильтр по статусу для быстрого нахождения нужного кандидата</p></div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Icon name="Wallet" className="w-6 h-6 text-primary" /></div>
              <div>
                <CardTitle className="text-lg flex items-center gap-1.5">Выплаты</CardTitle>
                <CardDescription className="mt-1">Управление вознаграждениями</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2"><Icon name="Settings" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Методы выплат</strong> — настройте доступные способы получения вознаграждений для сотрудников</p></div>
            <div className="flex gap-2"><Icon name="CheckCircle" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Подтвердить / отклонить</strong> — управляйте запросами на вывод средств от сотрудников</p></div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Icon name="Newspaper" className="w-6 h-6 text-primary" /></div>
              <div>
                <CardTitle className="text-lg flex items-center gap-1.5">Новости</CardTitle>
                <CardDescription className="mt-1">Корпоративные коммуникации</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2"><Icon name="Plus" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Создать пост</strong> — кнопка "Создать" в правом верхнем углу. Доступны категории: новость, достижение, объявление, блог</p></div>
            <div className="flex gap-2"><Icon name="Archive" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Архивировать</strong> — скрыть устаревший пост без удаления</p></div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Icon name="MessageSquare" className="w-6 h-6 text-primary" /></div>
              <div>
                <CardTitle className="text-lg flex items-center gap-1.5">Чаты</CardTitle>
                <CardDescription className="mt-1">Личная переписка с сотрудниками</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2"><Icon name="Send" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Открыть чат</strong> — нажмите на карточку сотрудника в разделе Чаты или кнопку "Написать" в разделе Сотрудники</p></div>
            <div className="flex gap-2"><Icon name="Paperclip" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Файлы</strong> — скрепка в поле ввода позволяет прикрепить резюме или документ</p></div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Icon name="BarChart" className="w-6 h-6 text-primary" /></div>
              <div>
                <CardTitle className="text-lg flex items-center gap-1.5">Статистика</CardTitle>
                <CardDescription className="mt-1">Эффективность реферальной программы</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2"><Icon name="TrendingUp" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Сводные показатели</strong> — общее число рекомендаций, наймов и выплаченных вознаграждений</p></div>
            <div className="flex gap-2"><Icon name="Trophy" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><p><strong>Топ сотрудников</strong> — рейтинг по количеству успешных рекомендаций</p></div>
          </CardContent>
        </Card>

        <Card className="border-2 bg-muted/30">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Icon name="HelpCircle" className="w-6 h-6 text-primary" /></div>
              <div>
                <CardTitle className="text-lg">Нужна помощь?</CardTitle>
                <CardDescription className="mt-1">Свяжитесь с нами</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3 items-start">
              <Icon name="Mail" className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div><p className="font-medium text-sm">Email</p><p className="text-sm text-muted-foreground">info@i-hunt.ru</p></div>
            </div>
            <div className="flex gap-3 items-start">
              <Icon name="Send" className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div><p className="font-medium text-sm">Telegram-блог</p><a href="https://t.me/i_hunt_ru" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">t.me/i_hunt_ru</a></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default HelpTab;