import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PersonalDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PersonalDataDialog({ open, onOpenChange }: PersonalDataDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Положение об обработке персональных данных</DialogTitle>
          <DialogDescription>
            Информация о порядке обработки и защиты персональных данных в соответствии с законодательством РФ
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 text-sm">
          <div>
            <h3 className="text-lg font-semibold mb-3">1. Общие положения</h3>
            <p className="text-muted-foreground">
              Настоящее Положение об обработке персональных данных (далее — Положение) разработано 
              в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» 
              (далее — Закон о персональных данных) и определяет порядок обработки персональных данных 
              и меры по обеспечению безопасности персональных данных в платформе iHUNT.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">2. Основные понятия</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Персональные данные</strong> — любая информация, относящаяся к прямо или косвенно определённому физическому лицу</li>
              <li><strong>Оператор</strong> — iHUNT, осуществляющий обработку персональных данных</li>
              <li><strong>Субъект персональных данных</strong> — физическое лицо, чьи данные обрабатываются</li>
              <li><strong>Обработка персональных данных</strong> — любое действие с персональными данными</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">3. Категории субъектов персональных данных</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li><strong>Сотрудники организации-работодателя</strong> — лица, использующие Платформу для рекомендации кандидатов</li>
              <li><strong>Кандидаты</strong> — лица, чьи данные размещаются на Платформе в качестве рекомендуемых кандидатов на вакантные должности</li>
              <li><strong>Представители работодателей</strong> — лица, представляющие интересы организаций-работодателей на Платформе</li>
              <li><strong>Посетители сайта</strong> — лица, посещающие сайт Платформы</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">5. Состав обрабатываемых персональных данных</h3>
            <p className="text-muted-foreground mb-2">В зависимости от категории субъекта обрабатываются следующие данные:</p>
            <div className="space-y-3 ml-4">
              <div>
                <p className="font-medium text-foreground">Сотрудники:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>ФИО, должность, структурное подразделение</li>
                  <li>Адрес электронной почты, номер телефона</li>
                  <li>Логин и пароль (хешированный)</li>
                  <li>История активности на Платформе</li>
                  <li>Банковские реквизиты для выплаты вознаграждений</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground">Кандидаты:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>ФИО, дата рождения</li>
                  <li>Адрес электронной почты, номер телефона</li>
                  <li>Образование, опыт работы, профессиональные навыки</li>
                  <li>Резюме и сопроводительные документы</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground">Представители работодателей:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>ФИО, должность</li>
                  <li>Адрес электронной почты, номер телефона</li>
                  <li>Данные организации: наименование, ИНН, юридический адрес</li>
                  <li>Банковские реквизиты для оплаты подписки</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">6. Цели обработки персональных данных</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Предоставление доступа к функционалу Платформы</li>
              <li>Идентификация пользователя и авторизация на Платформе</li>
              <li>Обеспечение подбора персонала через механизм рекомендаций</li>
              <li>Выплата вознаграждений сотрудникам за успешные рекомендации</li>
              <li>Взаимодействие с пользователями (уведомления, техподдержка)</li>
              <li>Анализ использования Платформы и улучшение её функционала</li>
              <li>Выполнение обязательств по договорам</li>
              <li>Соблюдение требований законодательства РФ</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">7. Способы обработки персональных данных</h3>
            <p className="text-muted-foreground mb-2">Обработка персональных данных осуществляется с использованием:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Автоматизированных средств (информационные системы, базы данных)</li>
              <li>Смешанных способов обработки (автоматизированных и неавтоматизированных)</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Обработка включает: сбор, запись, систематизацию, накопление, хранение, уточнение, 
              извлечение, использование, передачу, обезличивание, блокирование, удаление, уничтожение.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">8. Меры защиты персональных данных</h3>
            <p className="text-muted-foreground mb-2">Для обеспечения безопасности персональных данных Оператор применяет:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Технические меры:</strong>
                <ul className="list-circle list-inside ml-6 mt-1">
                  <li>Шифрование данных при передаче (SSL/TLS)</li>
                  <li>Хеширование паролей с использованием современных алгоритмов</li>
                  <li>Межсетевые экраны и системы обнаружения вторжений</li>
                  <li>Регулярное резервное копирование данных</li>
                  <li>Антивирусная защита и обновление программного обеспечения</li>
                </ul>
              </li>
              <li><strong>Организационные меры:</strong>
                <ul className="list-circle list-inside ml-6 mt-1">
                  <li>Назначение ответственного за организацию обработки персональных данных</li>
                  <li>Разграничение прав доступа к персональным данным</li>
                  <li>Обучение сотрудников правилам работы с персональными данными</li>
                  <li>Контроль за соблюдением требований законодательства</li>
                  <li>Заключение соглашений о конфиденциальности с сотрудниками</li>
                </ul>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">9. Передача персональных данных третьим лицам</h3>
            <p className="text-muted-foreground">
              Передача персональных данных третьим лицам осуществляется только:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
              <li>С согласия субъекта персональных данных</li>
              <li>В случаях, предусмотренных законодательством РФ</li>
              <li>Для достижения целей обработки (например, передача данных кандидатов работодателям)</li>
              <li>Поставщикам IT-услуг и хостинг-провайдерам (при условии соблюдения ими требований по защите данных)</li>
              <li>Платёжным системам для обработки финансовых операций</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              При передаче данных третьим лицам Оператор обеспечивает соблюдение режима конфиденциальности 
              путём заключения соответствующих соглашений.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">10. Права субъектов персональных данных</h3>
            <p className="text-muted-foreground mb-2">Субъект персональных данных имеет право:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>На получение информации об обработке своих персональных данных</li>
              <li>На доступ к своим персональным данным</li>
              <li>На уточнение, исправление или дополнение своих персональных данных</li>
              <li>На отзыв согласия на обработку персональных данных</li>
              <li>На удаление персональных данных (право на забвение)</li>
              <li>На ограничение обработки персональных данных</li>
              <li>На обжалование действий Оператора в уполномоченном органе (Роскомнадзор) или в судебном порядке</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Для реализации своих прав субъект может направить письменный запрос Оператору по адресу:{' '}
              <a href="mailto:privacy@ihunt.ru" className="text-primary hover:underline">info@i-hunt.ru</a>
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">11. Сроки обработки и хранения персональных данных</h3>
            <p className="text-muted-foreground">
              Персональные данные обрабатываются в течение срока, необходимого для достижения целей обработки, 
              если иное не предусмотрено законодательством РФ:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
              <li>Данные сотрудников — в период использования Платформы и в течение 5 лет после завершения использования</li>
              <li>Данные кандидатов — до момента найма или отказа, но не более 1 года с момента размещения</li>
              <li>Финансовые документы — в течение сроков, установленных законодательством (не менее 5 лет)</li>
              <li>Технические данные (логи) — не более 6 месяцев</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              По истечении сроков хранения персональные данные подлежат уничтожению или обезличиванию.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">12. Трансграничная передача персональных данных</h3>
            <p className="text-muted-foreground">
              Оператор не осуществляет трансграничную передачу персональных данных. 
              Все данные хранятся и обрабатываются на серверах, расположенных на территории Российской Федерации, 
              в соответствии с требованиями Федерального закона № 152-ФЗ.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">13. Изменение Положения</h3>
            <p className="text-muted-foreground">
              Оператор имеет право вносить изменения в настоящее Положение. Актуальная версия Положения 
              размещается на сайте Платформы. При внесении существенных изменений пользователи уведомляются 
              не менее чем за 30 дней до вступления изменений в силу.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">14. Контактная информация</h3>
            <p className="text-muted-foreground">Оператор персональных данных: iHUNT</p>
            <p className="text-muted-foreground mt-2">По вопросам обработки персональных данных обращайтесь:</p>
            <ul className="list-none space-y-1 text-muted-foreground mt-2 ml-4">
              <li>Email: <a href="mailto:privacy@ihunt.ru" className="text-primary hover:underline">info@i-hunt.ru</a></li>
              <li>Адрес: Россия, г. Москва</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              <strong>Дата вступления в силу:</strong> 16 января 2026 г.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
