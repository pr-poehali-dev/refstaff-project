import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { api, type Vacancy, type Company } from '@/lib/api';

function VacancyReferral() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const referrerId = searchParams.get('ref');

  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    comment: ''
  });

  useEffect(() => {
    loadVacancyData();
  }, [token]);

  const loadVacancyData = async () => {
    try {
      setIsLoading(true);
      
      const vacanciesData = await api.getVacancies(1, 'active');
      const foundVacancy = vacanciesData.find(v => v.referral_token === token);
      
      if (foundVacancy) {
        setVacancy(foundVacancy);
        
        const companyData = await api.getCompany(foundVacancy.company_id || 1);
        setCompany(companyData);
      }
    } catch (error) {
      console.error('Ошибка загрузки вакансии:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vacancy || !form.name || !form.email) {
      alert('Заполните обязательные поля');
      return;
    }

    try {
      await api.createRecommendation({
        vacancy_id: vacancy.id,
        recommended_by: referrerId ? parseInt(referrerId) : undefined,
        candidate_name: form.name,
        candidate_email: form.email,
        candidate_phone: form.phone,
        comment: form.comment
      });
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Ошибка отправки:', error);
      alert('Не удалось отправить отклик');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка вакансии...</p>
        </div>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <Icon name="AlertCircle" className="text-red-600" size={32} />
            </div>
            <CardTitle>Вакансия не найдена</CardTitle>
            <CardDescription>Возможно, ссылка устарела или вакансия закрыта</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = '/'}>
              Вернуться на главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Icon name="CheckCircle" className="text-green-600" size={32} />
            </div>
            <CardTitle>Отклик успешно отправлен!</CardTitle>
            <CardDescription>Мы рассмотрим вашу кандидатуру и свяжемся с вами</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/10 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Вы откликнулись на вакансию</p>
              <p className="font-semibold text-lg">{vacancy.title}</p>
              <p className="text-sm text-muted-foreground">{company?.name}</p>
            </div>
            <Button className="w-full" onClick={() => window.location.href = '/'}>
              Посмотреть другие вакансии
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Rocket" className="text-primary" size={28} />
            <span className="text-xl font-bold">RefStaff</span>
          </div>
          {company?.website && (
            <Button variant="ghost" size="sm" onClick={() => window.open(company.website, '_blank')}>
              <Icon name="ExternalLink" className="mr-2" size={16} />
              Сайт компании
            </Button>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <Badge className="mb-4">
                <Icon name="Briefcase" className="mr-1" size={14} />
                Вакансия
              </Badge>
              <h1 className="text-4xl font-bold mb-4">{vacancy.title}</h1>
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Icon name="Building2" size={18} />
                  <span>{company?.name}</span>
                </div>
                {vacancy.department && (
                  <div className="flex items-center gap-2">
                    <Icon name="Users" size={18} />
                    <span>{vacancy.department}</span>
                  </div>
                )}
                {vacancy.salary_display && (
                  <div className="flex items-center gap-2">
                    <Icon name="Wallet" size={18} />
                    <span>{vacancy.salary_display}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {vacancy.description && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Icon name="FileText" size={20} />
                  Описание вакансии
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{vacancy.description}</p>
              </div>
            )}

            {vacancy.requirements && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Icon name="CheckSquare" size={20} />
                  Требования
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{vacancy.requirements}</p>
              </div>
            )}

            {company && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Icon name="Building2" size={20} />
                    О компании
                  </h3>
                  {company.description && (
                    <p className="text-muted-foreground mb-3">{company.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-sm">
                    {company.industry && (
                      <Badge variant="outline">
                        <Icon name="Briefcase" className="mr-1" size={12} />
                        {company.industry}
                      </Badge>
                    )}
                    {company.employee_count && (
                      <Badge variant="outline">
                        <Icon name="Users" className="mr-1" size={12} />
                        {company.employee_count}+ сотрудников
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}

            {vacancy.reward_amount && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon name="Award" className="text-primary" size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Вознаграждение за рекомендацию</p>
                      <p className="text-xl font-bold text-primary">{vacancy.reward_amount.toLocaleString()} ₽</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Откликнуться на вакансию</CardTitle>
                <CardDescription>Заполните форму, и мы свяжемся с вами</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">ФИО *</Label>
                    <Input
                      id="name"
                      placeholder="Иван Иванов"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ivan@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+7 (999) 123-45-67"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="comment">Сопроводительное письмо</Label>
                    <Textarea
                      id="comment"
                      placeholder="Расскажите, почему вы подходите на эту позицию..."
                      rows={4}
                      value={form.comment}
                      onChange={(e) => setForm({ ...form, comment: e.target.value })}
                    />
                  </div>

                  {referrerId && (
                    <div className="bg-blue-50 p-3 rounded-lg text-sm">
                      <Icon name="Info" size={16} className="inline mr-2 text-blue-600" />
                      <span className="text-blue-900">Вы откликаетесь по рекомендации</span>
                    </div>
                  )}

                  <Button type="submit" className="w-full" size="lg">
                    <Icon name="Send" className="mr-2" size={18} />
                    Отправить отклик
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Нажимая кнопку, вы соглашаетесь на обработку персональных данных
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="border-t bg-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 RefStaff. Платформа реферального рекрутинга</p>
        </div>
      </footer>
    </div>
  );
}

export default VacancyReferral;
