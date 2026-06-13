import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsDialog({ open, onOpenChange }: TermsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Пользовательское соглашение</DialogTitle>
          <DialogDescription>Последнее обновление: 14 ноября 2025 г.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 pt-4 text-sm">
          <div>
            <h3 className="text-lg font-semibold mb-3">1. Общие условия</h3>
            <p className="text-muted-foreground">
              Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между iHUNT 
              (далее — «Сервис») и пользователями платформы. Регистрируясь на Платформе, вы подтверждаете, что 
              прочитали, поняли и согласны соблюдать условия настоящего Соглашения.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">2. Предмет Соглашения</h3>
            <p className="text-muted-foreground">
              iHUNT предоставляет онлайн-платформу для организации реферального рекрутинга, включающую:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
              <li>Управление вакансиями и кандидатами</li>
              <li>Систему вознаграждений за рекомендации</li>
              <li>Инструменты коммуникации и аналитики</li>
              <li>Интеграцию с внешними сервисами</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">3. Регистрация и учетная запись</h3>
            <p className="text-muted-foreground mb-2">При регистрации вы обязуетесь:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Предоставить достоверные и актуальные данные</li>
              <li>Обеспечить конфиденциальность учетных данных</li>
              <li>Немедленно уведомлять о несанкционированном доступе к аккаунту</li>
              <li>Нести ответственность за все действия, совершенные через вашу учетную запись</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">4. Тарифы и оплата</h3>
            <p className="text-muted-foreground">
              Сервис предоставляет 14-дневный бесплатный пробный период. После окончания пробного периода использование 
              Платформы осуществляется на платной основе согласно выбранному тарифному плану.
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
              <li>Оплата производится ежемесячно или ежегодно</li>
              <li>Цены указаны на сайте и могут быть изменены с уведомлением за 30 дней</li>
              <li>Возврат средств возможен в течение 14 дней с момента оплаты</li>
              <li>При просрочке оплаты доступ к Платформе может быть ограничен</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">5. Права и обязанности пользователя</h3>
            <p className="text-muted-foreground mb-2">Пользователь обязуется:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Использовать Платформу в законных целях</li>
              <li>Не нарушать права третьих лиц</li>
              <li>Не распространять вредоносное ПО</li>
              <li>Не создавать несколько аккаунтов для одной компании без согласования</li>
              <li>Соблюдать правила работы с персональными данными кандидатов</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">6. Права и обязанности Сервиса</h3>
            <p className="text-muted-foreground mb-2">iHUNT имеет право:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Изменять функционал Платформы</li>
              <li>Проводить технические работы с уведомлением пользователей</li>
              <li>Ограничить доступ при нарушении условий Соглашения</li>
              <li>Удалить аккаунт при систематических нарушениях</li>
            </ul>
            <p className="text-muted-foreground mt-2 mb-2">iHUNT обязуется:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Обеспечивать доступность Платформы не менее 99% времени</li>
              <li>Защищать персональные данные пользователей</li>
              <li>Предоставлять техническую поддержку</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">7. Интеллектуальная собственность</h3>
            <p className="text-muted-foreground">
              Все права на Платформу, включая код, дизайн, логотипы и контент, принадлежат iHUNT. 
              Использование материалов Платформы без письменного разрешения запрещено.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">8. Ограничение ответственности</h3>
            <p className="text-muted-foreground">
              iHUNT не несет ответственности за:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
              <li>Качество и достоверность информации о кандидатах</li>
              <li>Результаты найма персонала</li>
              <li>Действия пользователей на Платформе</li>
              <li>Технические сбои, вызванные внешними факторами</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">9. Расторжение Соглашения</h3>
            <p className="text-muted-foreground">
              Вы можете прекратить использование Платформы в любое время, удалив свою учетную запись. 
              iHUNT может расторгнуть Соглашение при нарушении его условий.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">10. Изменения Соглашения</h3>
            <p className="text-muted-foreground">
              iHUNT оставляет за собой право изменять условия настоящего Соглашения. О существенных изменениях 
              пользователи будут уведомлены за 30 дней.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">11. Применимое право</h3>
            <p className="text-muted-foreground">
              Настоящее Соглашение регулируется законодательством Российской Федерации. Все споры разрешаются 
              путем переговоров, а при невозможности достижения согласия — в судебном порядке.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">12. Контакты</h3>
            <p className="text-muted-foreground">
              По вопросам Соглашения обращайтесь:
            </p>
            <p className="text-muted-foreground mt-2">
              Email: <a href="mailto:legal@ihunt.ru" className="text-primary hover:underline">info@i-hunt.ru</a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
