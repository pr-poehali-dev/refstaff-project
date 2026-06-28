import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface ContactSectionProps {
  form: ContactForm;
  onFormChange: (form: ContactForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export function ContactSection({ form, onFormChange, onSubmit, isSubmitting }: ContactSectionProps) {
  return (
    <section id="contact" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 lg:px-6 bg-gradient-to-br from-green-50 via-white to-blue-50 relative overflow-hidden" aria-labelledby="contact-title">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="container mx-auto max-w-3xl relative z-10">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20 text-xs sm:text-sm">💬 Контакты</Badge>
          <h2 id="contact-title" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Обратная связь</h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground px-4">
            Свяжитесь с нами, и мы с радостью ответим на все ваши вопросы
          </p>
        </div>

        <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 to-blue-500"></div>
          <div className="p-5 sm:p-6 md:p-8 lg:p-10">
            <form className="space-y-4 sm:space-y-5 md:space-y-6" aria-label="Форма обратной связи" onSubmit={onSubmit}>
              <div>
                <Label htmlFor="name" className="text-sm sm:text-base font-medium">Имя</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Иван Иванов"
                  autoComplete="name"
                  required
                  className="mt-1.5 sm:mt-2 h-10 sm:h-11 md:h-12"
                  value={form.name}
                  onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm sm:text-base font-medium">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ivan@company.ru"
                  autoComplete="email"
                  required
                  className="mt-1.5 sm:mt-2 h-10 sm:h-11 md:h-12"
                  value={form.email}
                  onChange={(e) => onFormChange({ ...form, email: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="contact-phone" className="text-sm sm:text-base font-medium">Телефон</Label>
                <Input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  autoComplete="tel"
                  className="mt-1.5 sm:mt-2 h-10 sm:h-11 md:h-12"
                  value={form.phone}
                  onChange={(e) => onFormChange({ ...form, phone: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="message" className="text-sm sm:text-base font-medium">Сообщение</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Расскажите о вашем проекте..."
                  rows={4}
                  required
                  className="mt-1.5 sm:mt-2 text-sm sm:text-base"
                  value={form.message}
                  onChange={(e) => onFormChange({ ...form, message: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-10 sm:h-11 md:h-12 text-sm sm:text-base bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Icon name="Loader2" className="mr-2 animate-spin" size={18} />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Icon name="Send" className="mr-2" size={18} />
                    Отправить сообщение
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}