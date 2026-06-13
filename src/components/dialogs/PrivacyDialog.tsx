import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PrivacyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyDialog({ open, onOpenChange }: PrivacyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Политика конфиденциальности</DialogTitle>
          <DialogDescription>Последнее обновление: 14 ноября 2025 г.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 pt-4 text-sm">
          <div>
            <h3 className="text-lg font-semibold mb-3">1. Общие положения</h3>
            <p className="text-muted-foreground">
              Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных 
              пользователей платформы iHUNT (далее — «Платформа»). Используя Платформу, вы соглашаетесь с условиями 
              настоящей Политики.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">2. Какие данные мы собираем</h3>
            <p className="text-muted-foreground mb-2">Мы можем собирать следующие категории персональных данных:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Контактные данные: имя, фамилия, электронная почта, номер телефона</li>
              <li>Данные компании: название, ИНН, количество сотрудников, отрасль</li>
              <li>Данные о вакансиях и рекомендациях кандидатов</li>
              <li>Техническая информация: IP-адрес, тип браузера, операционная система</li>
              <li>Данные об использовании Платформы: активность, статистика взаимодействий</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">3. Цели обработки данных</h3>
            <p className="text-muted-foreground mb-2">Мы обрабатываем ваши персональные данные для:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Предоставления услуг Платформы и их улучшения</li>
              <li>Выполнения договорных обязательств</li>
              <li>Технической поддержки пользователей</li>
              <li>Отправки уведомлений о важных событиях</li>
              <li>Аналитики и улучшения функционала</li>
              <li>Соблюдения законодательных требований</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">4. Защита данных</h3>
            <p className="text-muted-foreground">
              Мы применяем современные технические и организационные меры для защиты ваших данных от несанкционированного 
              доступа, изменения, раскрытия или уничтожения. Данные хранятся на защищенных серверах с использованием 
              шифрования и других методов защиты.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">5. Передача данных третьим лицам</h3>
            <p className="text-muted-foreground">
              Мы не продаем и не передаем ваши персональные данные третьим лицам, за исключением случаев:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
              <li>Когда это необходимо для предоставления услуг (например, платежные системы)</li>
              <li>По требованию законодательства или государственных органов</li>
              <li>С вашего явного согласия</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">6. Ваши права</h3>
            <p className="text-muted-foreground mb-2">Вы имеете право:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Запрашивать доступ к своим персональным данным</li>
              <li>Требовать исправления неточных данных</li>
              <li>Запрашивать удаление своих данных</li>
              <li>Отозвать согласие на обработку данных</li>
              <li>Ограничить обработку данных</li>
              <li>Получить копию своих данных</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">7. Cookies</h3>
            <p className="text-muted-foreground">
              Мы используем cookies для улучшения работы Платформы, анализа трафика и персонализации контента. 
              Вы можете настроить параметры cookies в своем браузере.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">8. Изменения в Политике</h3>
            <p className="text-muted-foreground">
              Мы можем периодически обновлять настоящую Политику. О существенных изменениях мы уведомим вас 
              по электронной почте или через Платформу.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">9. Контакты</h3>
            <p className="text-muted-foreground">
              По вопросам обработки персональных данных обращайтесь:
            </p>
            <p className="text-muted-foreground mt-2">
              Email: <a href="mailto:privacy@ihunt.ru" className="text-primary hover:underline">info@i-hunt.ru</a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
