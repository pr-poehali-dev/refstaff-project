import { useState } from 'react';
import Icon from '@/components/ui/icon';

const FAQ_ITEMS = [
  {
    question: 'Что такое реферальный рекрутинг?',
    answer: 'Это система найма, где действующие сотрудники рекомендуют знакомых на открытые вакансии и получают за это денежное вознаграждение. Компания получает проверенного кандидата, сотрудник — бонус, кандидат — работу через доверенный источник.',
  },
  {
    question: 'Сколько можно сэкономить на найме?',
    answer: 'Компании экономят до 70% по сравнению с агентствами. Средняя стоимость закрытия вакансии через реферала в 3–4 раза ниже рыночной — нет комиссии агентству, нет платы за размещение на job-бордах.',
  },
  {
    question: 'Как быстро закрываются вакансии через рефералов?',
    answer: 'В среднем в 2 раза быстрее обычного найма. Реферал уже знаком с культурой компании через рекомендателя, поэтому принимает решение быстрее и реже отказывается от оффера.',
  },
  {
    question: 'Подходит ли платформа для малого бизнеса?',
    answer: 'Да, платформа работает от 5 сотрудников. Есть пробный период 14 дней без ограничений — можно запустить первую реферальную программу и получить результат ещё до оплаты.',
  },
  {
    question: 'Почему рефералы лучше проходят испытательный срок?',
    answer: 'Статистически 82% рефералов успешно проходят испытательный срок против 60% у кандидатов с job-бордов. Рекомендатель несёт репутационную ответственность, поэтому советует только тех, в ком уверен.',
  },
  {
    question: 'Как выплачиваются вознаграждения сотрудникам?',
    answer: 'Вознаграждение выплачивается автоматически через платформу после того, как реферал успешно прошёл испытательный срок. Компания сама настраивает размер бонуса для каждой вакансии.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 lg:px-6 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-purple-50/40 pointer-events-none" />
      <div className="container mx-auto max-w-3xl relative z-10">
        <div className="text-center mb-10 sm:mb-12">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mb-3 uppercase tracking-wide">
            Частые вопросы
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
            Остались{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              вопросы?
            </span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Отвечаем на самые популярные вопросы о реферальном рекрутинге и платформе
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className="border border-border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => toggle(i)}
              >
                <span className="font-semibold text-foreground text-sm sm:text-base">
                  {item.question}
                </span>
                <span className={`shrink-0 text-primary transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}>
                  <Icon name="ChevronDown" size={20} />
                </span>
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 text-muted-foreground text-sm sm:text-base leading-relaxed border-t border-border pt-4">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-muted-foreground text-sm">
            Не нашли ответ?{' '}
            <a href="#contact" className="text-primary font-medium hover:underline">
              Напишите нам
            </a>
          </p>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      })}} />
    </section>
  );
}
