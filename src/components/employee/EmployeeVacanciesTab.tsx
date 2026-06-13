import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import type { Vacancy } from '@/types';

interface RecommendationForm {
  name: string;
  email: string;
  phone: string;
  comment: string;
}

interface EmployeeVacanciesTabProps {
  isSubscriptionExpired: boolean;
  vacancies: Vacancy[];
  vacancySearchQuery: string;
  onSearchChange: (q: string) => void;
  activeVacancy: Vacancy | null;
  onSetActiveVacancy: (v: Vacancy | null) => void;
  recommendationForm: RecommendationForm;
  onRecommendationFormChange: (f: RecommendationForm) => void;
  onCreateRecommendation: (params: { vacancyId: number; name: string; email: string; phone: string; comment: string }) => void;
  onViewDetail: (vacancy: Vacancy) => void;
}

interface SubscriptionExpiredBlockProps {
  isEmployee?: boolean;
}

function SubscriptionExpiredPlaceholder({ isEmployee }: SubscriptionExpiredBlockProps) {
  // Rendered only when subscription is expired — actual component is lazy-loaded in Index.tsx
  // This placeholder keeps types clean without importing the lazy component directly
  return (
    <div className="text-center py-12 text-muted-foreground">
      {isEmployee ? 'Подписка истекла' : 'Подписка компании истекла'}
    </div>
  );
}

export function EmployeeVacanciesTab({
  isSubscriptionExpired,
  vacancies,
  vacancySearchQuery,
  onSearchChange,
  activeVacancy,
  onSetActiveVacancy,
  recommendationForm,
  onRecommendationFormChange,
  onCreateRecommendation,
  onViewDetail,
}: EmployeeVacanciesTabProps) {
  const navigate = useNavigate();

  if (isSubscriptionExpired) {
    return <SubscriptionExpiredPlaceholder isEmployee />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
        <h2 className="text-lg sm:text-2xl font-semibold flex items-center gap-2">
          <span>💼 Вакансии</span>
          <span className="hidden sm:inline"></span>
        </h2>
      </div>
      <div className="mb-4">
        <Input
          placeholder="Поиск..."
          value={vacancySearchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full text-sm"
        />
      </div>

      <div className="grid gap-4">
        {vacancies.filter(v =>
          vacancySearchQuery === '' ||
          v.title.toLowerCase().includes(vacancySearchQuery.toLowerCase()) ||
          v.department.toLowerCase().includes(vacancySearchQuery.toLowerCase())
        ).map((vacancy) => (
          <Card
            key={vacancy.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader className="p-3 sm:p-6 relative">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetActiveVacancy(vacancy);
                    }}
                  >
                    <Icon name="UserPlus" size={18} />
                  </Button>
                </DialogTrigger>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                  <DialogHeader>
                    <DialogTitle>Данные кандидата</DialogTitle>
                    <DialogDescription>
                      Вакансия: {activeVacancy?.title}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="candidate-name">ФИО кандидата <span className="text-destructive">*</span></Label>
                      <Input
                        id="candidate-name"
                        placeholder="Иван Иванов"
                        value={recommendationForm.name}
                        onChange={(e) => onRecommendationFormChange({ ...recommendationForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="candidate-phone">Телефон <span className="text-destructive">*</span></Label>
                      <Input
                        id="candidate-phone"
                        placeholder="+7 (999) 123-45-67"
                        value={recommendationForm.phone}
                        onChange={(e) => onRecommendationFormChange({ ...recommendationForm, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="candidate-email">Email</Label>
                      <Input
                        id="candidate-email"
                        type="email"
                        placeholder="ivan@example.com"
                        value={recommendationForm.email}
                        onChange={(e) => onRecommendationFormChange({ ...recommendationForm, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="comment">Сопроводительное письмо <span className="text-destructive">*</span></Label>
                      <Textarea
                        id="comment"
                        placeholder="Почему этот кандидат подходит..."
                        rows={3}
                        value={recommendationForm.comment}
                        onChange={(e) => onRecommendationFormChange({ ...recommendationForm, comment: e.target.value })}
                      />
                    </div>
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="Award" className="text-primary" size={20} />
                        <span className="font-medium">Вознаграждение за успешный найм</span>
                      </div>
                      <div className="text-2xl font-bold text-primary">{activeVacancy?.reward.toLocaleString()} ₽</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activeVacancy?.payoutDelayDays === 0
                          ? 'Выплата сразу после найма'
                          : `Выплата через ${activeVacancy?.payoutDelayDays} ${activeVacancy?.payoutDelayDays === 1 ? 'день' : (activeVacancy?.payoutDelayDays ?? 0) < 5 ? 'дня' : 'дней'} после найма`
                        }
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      disabled={!recommendationForm.name || !recommendationForm.phone || !recommendationForm.comment}
                      onClick={() => activeVacancy && onCreateRecommendation({
                        vacancyId: activeVacancy.id,
                        name: recommendationForm.name,
                        email: recommendationForm.email,
                        phone: recommendationForm.phone,
                        comment: recommendationForm.comment,
                      })}
                    >
                      Отправить рекомендацию
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 pr-10">
                <div
                  className="flex-1 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => {
                    if (vacancy.referralLink) {
                      window.open(vacancy.referralLink, '_blank');
                    }
                  }}
                >
                  <CardTitle className="text-sm sm:text-lg">{vacancy.title}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{vacancy.department}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <Icon name="Wallet" size={14} className="text-muted-foreground" />
                    <span className="truncate">{vacancy.salary}</span>
                  </div>
                  {vacancy.city && (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <Icon name={vacancy.isRemote ? 'Home' : 'MapPin'} size={14} className="text-muted-foreground" />
                      <span className="truncate">{vacancy.city}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-primary">
                    <Icon name="Award" size={14} />
                    <span className="font-medium">{vacancy.reward.toLocaleString()} ₽</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Icon name="Clock" size={14} />
                    <span>Выплата через {vacancy.payoutDelayDays} {vacancy.payoutDelayDays === 1 ? 'день' : vacancy.payoutDelayDays < 5 ? 'дня' : 'дней'} после найма</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-[10px] sm:text-xs text-muted-foreground">Ссылка на вакансию</Label>
                  <div className="flex gap-1 sm:gap-2">
                    <Input
                      value={vacancy.referralLink}
                      readOnly
                      className="text-[10px] sm:text-xs flex-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button size="sm" variant="outline" className="px-2 sm:px-3" onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(vacancy.referralLink || '');
                      alert('Ссылка скопирована');
                    }}>
                      <Icon name="Copy" size={14} />
                    </Button>
                    <Button size="sm" variant="outline" className="px-2 sm:px-3" onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/vacancy/${vacancy.id}/qr`, { state: { referralLink: vacancy.referralLink, title: vacancy.title } });
                    }}>
                      <Icon name="QrCode" size={14} />
                    </Button>
                  </div>
                  <Button size="sm" className="sm:hidden w-full text-xs bg-primary text-primary-foreground hover:bg-primary/90" onClick={(e) => {
                    e.stopPropagation();
                    const text = `Привет! Смотри, есть отличная вакансия "${vacancy.title}" в нашей компании. Зарплата ${vacancy.salary}. Вот ссылка: ${vacancy.referralLink}`;
                    if (navigator.share) {
                      navigator.share({
                        title: vacancy.title,
                        text: text,
                        url: vacancy.referralLink,
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(text);
                      alert('Текст скопирован');
                    }
                  }}>
                    <Icon name="Share2" size={14} className="mr-2" />
                    Поделиться вакансией
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default EmployeeVacanciesTab;
