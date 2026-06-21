import React, { lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import type { Vacancy } from '@/types';

const SubscriptionExpiredBlock = lazy(() => import('@/components/SubscriptionExpiredBlock').then(m => ({ default: m.SubscriptionExpiredBlock })));

const LazyFallback = () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

export interface VacanciesTabProps {
  isSubscriptionExpired: boolean;
  onRenew: () => void;
  vacancies: Vacancy[];
  vacancyFilter: { search: string; status: string };
  onVacancyFilterChange: (f: { search: string; status: string }) => void;
  vacancyForm: { title: string; department: string; salary: string; description: string; requirements: string; motivation: string; reward: string; payoutDelay: string; city: string; isRemote: boolean };
  onVacancyFormChange: (f: VacanciesTabProps['vacancyForm']) => void;
  onCreateVacancy: () => void;
  onUpdateVacancy: (vacancy: Vacancy) => void;
  onArchiveVacancy: (id: number) => void;
  onRestoreVacancy: (id: number) => void;
  onDeleteVacancy: (id: number) => void;
  onViewDetail: (vacancy: Vacancy) => void;
  activeVacancy: Vacancy | null;
  onActiveVacancyChange: (vacancy: Vacancy | null) => void;
  onTestManager: (vacancy: { id: number; title: string }) => void;
  newReward: string;
  onNewRewardChange: (v: string) => void;
}

export function VacanciesTab({
  isSubscriptionExpired,
  onRenew,
  vacancies,
  vacancyFilter,
  onVacancyFilterChange,
  vacancyForm,
  onVacancyFormChange,
  onCreateVacancy,
  onArchiveVacancy,
  onRestoreVacancy,
  onDeleteVacancy,
  onViewDetail,
  activeVacancy,
  onActiveVacancyChange,
  onTestManager,
}: VacanciesTabProps) {
  return (
    <>
      {isSubscriptionExpired ? (
        <Suspense fallback={<LazyFallback />}>
          <SubscriptionExpiredBlock onRenew={onRenew} />
        </Suspense>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
              <span>💼 Вакансии</span>
              <span className="hidden sm:inline"></span>
            </h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button disabled={isSubscriptionExpired} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">Создать вакансию</Button>
              </DialogTrigger>
              <DialogContent className="w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg rounded-none sm:rounded-lg flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
                  <DialogTitle className="text-base">Новая вакансия</DialogTitle>
                  <DialogDescription className="text-xs">Создайте вакансию для реферального найма</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="vacancy-title" className="text-xs">Должность</Label>
                      <Input
                        id="vacancy-title"
                        className="mt-1 h-9 text-sm"
                        placeholder="Frontend Developer"
                        value={vacancyForm.title}
                        onChange={(e) => onVacancyFormChange({ ...vacancyForm, title: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="salary" className="text-xs">Зарплата</Label>
                      <Input
                        id="salary"
                        className="mt-1 h-9 text-sm"
                        placeholder="250 000 ₽"
                        value={vacancyForm.salary}
                        onChange={(e) => onVacancyFormChange({ ...vacancyForm, salary: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-xs">Город</Label>
                      <Input
                        id="city"
                        className="mt-1 h-9 text-sm"
                        placeholder="Москва"
                        value={vacancyForm.city}
                        onChange={(e) => onVacancyFormChange({ ...vacancyForm, city: e.target.value })}
                        disabled={vacancyForm.isRemote}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isRemote"
                      checked={vacancyForm.isRemote}
                      onCheckedChange={(checked) => onVacancyFormChange({ ...vacancyForm, isRemote: checked as boolean, city: checked ? 'Удалённо' : '' })}
                    />
                    <Label htmlFor="isRemote" className="cursor-pointer text-xs">Удалённая работа</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="reward-amount" className="text-xs">Бонус за рекомендацию ₽</Label>
                      <Input
                        id="reward-amount"
                        type="number"
                        className="mt-1 h-9 text-sm"
                        placeholder="30000"
                        value={vacancyForm.reward}
                        onChange={(e) => onVacancyFormChange({ ...vacancyForm, reward: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="payout-delay" className="text-xs">Срок выплаты</Label>
                      <Select
                        value={vacancyForm.payoutDelay}
                        onValueChange={(value) => onVacancyFormChange({ ...vacancyForm, payoutDelay: value })}
                      >
                        <SelectTrigger id="payout-delay" className="mt-1 h-9 text-sm">
                          <SelectValue placeholder="Выберите" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Сразу</SelectItem>
                          <SelectItem value="7">7 дней</SelectItem>
                          <SelectItem value="14">14 дней</SelectItem>
                          <SelectItem value="30">30 дней</SelectItem>
                          <SelectItem value="45">45 дней</SelectItem>
                          <SelectItem value="60">60 дней</SelectItem>
                          <SelectItem value="90">90 дней (исп. срок)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-xs">Описание вакансии</Label>
                    <Textarea
                      id="description"
                      placeholder="Расскажите о вакансии, задачах и условиях..."
                      rows={3}
                      className="mt-1 text-sm"
                      value={vacancyForm.description}
                      onChange={(e) => onVacancyFormChange({ ...vacancyForm, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="requirements" className="text-xs">Требования</Label>
                    <Textarea
                      id="requirements"
                      placeholder="Опыт работы от 5 лет, знание React..."
                      rows={3}
                      className="mt-1 text-sm"
                      value={vacancyForm.requirements}
                      onChange={(e) => onVacancyFormChange({ ...vacancyForm, requirements: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="motivation" className="text-xs">Мотивация</Label>
                    <Textarea
                      id="motivation"
                      placeholder="Что мы предлагаем: ДМС, гибкий график, обучение..."
                      rows={3}
                      className="mt-1 text-sm"
                      value={vacancyForm.motivation}
                      onChange={(e) => onVacancyFormChange({ ...vacancyForm, motivation: e.target.value })}
                    />
                  </div>
                </div>
                <div className="px-4 py-3 border-t shrink-0">
                  <Button className="w-full" onClick={onCreateVacancy}>Создать вакансию</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Поиск..."
                value={vacancyFilter.search}
                onChange={(e) => onVacancyFilterChange({ ...vacancyFilter, search: e.target.value })}
                className="text-sm"
              />
            </div>
            <Select value={vacancyFilter.status} onValueChange={(value) => onVacancyFilterChange({ ...vacancyFilter, status: value })}>
              <SelectTrigger className="w-full sm:w-[160px] text-sm">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="archived">Архив</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {vacancies.filter(v => {
              const searchMatch = vacancyFilter.search === '' ||
                v.title.toLowerCase().includes(vacancyFilter.search.toLowerCase()) ||
                v.department.toLowerCase().includes(vacancyFilter.search.toLowerCase());
              const statusMatch = vacancyFilter.status === 'all' || v.status === vacancyFilter.status;
              return searchMatch && statusMatch;
            }).sort((a, b) => {
              if (a.status === 'archived' && b.status !== 'archived') return 1;
              if (a.status !== 'archived' && b.status === 'archived') return -1;
              return 0;
            }).map((vacancy) => (
              <Card key={vacancy.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="p-2 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-1.5 sm:gap-3">
                    <div
                      className="cursor-pointer hover:opacity-70 transition-opacity flex-1"
                      onClick={() => onViewDetail(vacancy)}
                    >
                      <CardTitle className="flex items-center gap-1.5 text-xs sm:text-lg">
                        {vacancy.title}
                        <Icon name="ExternalLink" size={12} className="text-muted-foreground" />
                      </CardTitle>
                      <CardDescription className="text-[10px] sm:text-sm">{vacancy.department}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Badge
                        variant="secondary"
                        className={`text-[9px] sm:text-xs px-1 sm:px-2 ${
                          vacancy.status === 'archived' ? 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400' : ''
                        }`}
                      >
                        {vacancy.status === 'active' ? 'Активна' : 'Архив'}
                      </Badge>
                      {vacancy.recommendations > 0 && (
                        <Badge variant="outline" className="text-[9px] sm:text-xs px-1 sm:px-2">
                          <Icon name="Users" size={8} className="mr-0.5" />
                          {vacancy.recommendations}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
                  <div className="space-y-2 sm:space-y-4">
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-sm">
                      <div className="flex items-center gap-1">
                        <Icon name="Wallet" size={12} className="text-muted-foreground" />
                        <span className="truncate">{vacancy.salary}</span>
                      </div>
                      {vacancy.city && (
                        <div className="flex items-center gap-1">
                          <Icon name={vacancy.isRemote ? "Home" : "MapPin"} size={12} className="text-muted-foreground" />
                          <span className="truncate">{vacancy.city}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-primary font-medium">
                        <Icon name="Award" size={12} />
                        <span>{vacancy.reward.toLocaleString()} ₽</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Icon name="Clock" size={12} />
                        <span>{vacancy.payoutDelayDays} дн.</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTestManager({ id: vacancy.id, title: vacancy.title })}
                        className="flex-1 sm:flex-none text-[10px] sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                      >
                        <span className="mr-1">📋</span>
                        <span className="hidden sm:inline">Тест</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onActiveVacancyChange(vacancy);
                          onVacancyFormChange({
                            title: vacancy.title,
                            department: vacancy.department,
                            salary: vacancy.salary,
                            description: vacancy.description || '',
                            requirements: vacancy.requirements || '',
                            motivation: vacancy.motivation || '',
                            reward: vacancy.reward.toString(),
                            payoutDelay: vacancy.payoutDelayDays.toString(),
                            city: vacancy.city || '',
                            isRemote: vacancy.isRemote || false,
                          });
                        }}
                        className="flex-1 sm:flex-none text-[10px] sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                      >
                        <span className="mr-1">✏️</span>
                        <span className="hidden sm:inline">Ред.</span>
                      </Button>
                      {vacancy.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onArchiveVacancy(vacancy.id)}
                          className="flex-1 sm:flex-none text-[10px] sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                        >
                          <span className="mr-1">📦</span>
                          <span className="hidden sm:inline">В архив</span>
                        </Button>
                      )}
                      {vacancy.status === 'archived' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRestoreVacancy(vacancy.id)}
                            className="flex-1 sm:flex-none text-[10px] sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                          >
                            <span className="mr-1">✅</span>
                            <span className="hidden sm:inline">Актив.</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (window.confirm('Удалить вакансию безвозвратно?')) {
                                onDeleteVacancy(vacancy.id);
                              }
                            }}
                            className="flex-1 sm:flex-none text-[10px] sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                          >
                            <span className="mr-1">🗑️</span>
                            <span className="hidden sm:inline">Удалить</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={activeVacancy !== null} onOpenChange={(open) => !open && onActiveVacancyChange(null)}>
            <DialogContent className="w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg rounded-none sm:rounded-lg flex flex-col p-0 overflow-hidden">
              <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
                <DialogTitle className="text-base">Редактировать вакансию</DialogTitle>
                <DialogDescription className="text-xs">Обновите информацию о вакансии</DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="edit-vacancy-title" className="text-xs">Должность</Label>
                    <Input
                      id="edit-vacancy-title"
                      className="mt-1 h-9 text-sm"
                      value={vacancyForm.title}
                      onChange={(e) => onVacancyFormChange({ ...vacancyForm, title: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="edit-salary" className="text-xs">Зарплата</Label>
                    <Input
                      id="edit-salary"
                      className="mt-1 h-9 text-sm"
                      value={vacancyForm.salary}
                      onChange={(e) => onVacancyFormChange({ ...vacancyForm, salary: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-reward-amount" className="text-xs">Бонус за рекомендацию, ₽</Label>
                    <Input
                      id="edit-reward-amount"
                      type="number"
                      className="mt-1 h-9 text-sm"
                      value={vacancyForm.reward}
                      onChange={(e) => onVacancyFormChange({ ...vacancyForm, reward: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-payout-delay" className="text-xs">Срок выплаты вознаграждения</Label>
                  <Select
                    value={vacancyForm.payoutDelay}
                    onValueChange={(value) => onVacancyFormChange({ ...vacancyForm, payoutDelay: value })}
                  >
                    <SelectTrigger id="edit-payout-delay" className="mt-1 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Сразу после найма</SelectItem>
                      <SelectItem value="7">7 дней</SelectItem>
                      <SelectItem value="14">14 дней</SelectItem>
                      <SelectItem value="30">30 дней</SelectItem>
                      <SelectItem value="45">45 дней</SelectItem>
                      <SelectItem value="60">60 дней</SelectItem>
                      <SelectItem value="90">90 дней (исп. срок)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-description" className="text-xs">Описание вакансии</Label>
                  <Textarea
                    id="edit-description"
                    rows={3}
                    className="mt-1 text-sm"
                    value={vacancyForm.description}
                    onChange={(e) => onVacancyFormChange({ ...vacancyForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-requirements" className="text-xs">Требования</Label>
                  <Textarea
                    id="edit-requirements"
                    rows={3}
                    className="mt-1 text-sm"
                    value={vacancyForm.requirements}
                    onChange={(e) => onVacancyFormChange({ ...vacancyForm, requirements: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-motivation" className="text-xs">Мотивация</Label>
                  <Textarea
                    id="edit-motivation"
                    rows={3}
                    className="mt-1 text-sm"
                    placeholder="Что мы предлагаем: ДМС, гибкий график, обучение..."
                    value={vacancyForm.motivation}
                    onChange={(e) => onVacancyFormChange({ ...vacancyForm, motivation: e.target.value })}
                  />
                </div>
              </div>
              <div className="px-4 py-3 border-t shrink-0 flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (activeVacancy) onVacancyFormChange(vacancyForm);
                  }}
                >
                  Сохранить
                </Button>
                {activeVacancy?.status === 'active' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (activeVacancy) {
                        onArchiveVacancy(activeVacancy.id);
                        onActiveVacancyChange(null);
                      }
                    }}
                  >
                    <Icon name="Archive" size={16} className="mr-1.5" />
                    В архив
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}

export default VacanciesTab;