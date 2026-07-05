import React, { lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import type { Recommendation } from '@/types';

const SubscriptionExpiredBlock = lazy(() => import('@/components/SubscriptionExpiredBlock').then(m => ({ default: m.SubscriptionExpiredBlock })));

const LazyFallback = () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

export interface RecommendationsTabProps {
  isSubscriptionExpired: boolean;
  onRenew: () => void;
  recommendations: Recommendation[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (f: string) => void;
  onUpdateStatus: (id: number, status: string) => void;
  onViewDetails: (rec: Recommendation) => void;
}

export function RecommendationsTab({
  isSubscriptionExpired,
  onRenew,
  recommendations,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onUpdateStatus,
  onViewDetails,
}: RecommendationsTabProps) {
  return (
    <>
      {isSubscriptionExpired ? (
        <Suspense fallback={<LazyFallback />}>
          <SubscriptionExpiredBlock onRenew={onRenew} />
        </Suspense>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
              <Icon name="Target" size={22} />
              <span className="hidden sm:inline">Рекомендации кандидатов</span>
              <span className="sm:hidden">Рекомендации</span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по кандидатам..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Фильтр по статусу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">На рассмотрении</SelectItem>
                <SelectItem value="accepted">Принятые</SelectItem>
                <SelectItem value="rejected">Отклонённые</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {recommendations.filter(rec => {
              const matchesSearch = searchQuery === '' ||
                rec.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                rec.vacancy.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (rec.recommendedBy && rec.recommendedBy.toLowerCase().includes(searchQuery.toLowerCase()));
              const matchesStatus = statusFilter === 'all' ||
                rec.status === statusFilter ||
                (statusFilter === 'accepted' && rec.status === 'hired') ||
                (statusFilter === 'hired' && rec.status === 'accepted');
              return matchesSearch && matchesStatus;
            }).map((rec) => (
              <Card key={rec.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onViewDetails(rec)}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg truncate">{rec.candidateName}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm truncate">{rec.vacancy}</CardDescription>
                      {rec.recommendedBy && (
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                            <AvatarFallback className="text-xs">{rec.recommendedBy.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs sm:text-sm text-muted-foreground truncate">
                            <span className="hidden sm:inline">Рекомендовал: </span><span className="font-medium text-foreground">{rec.recommendedBy}</span>
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge variant={
                      rec.status === 'accepted' || rec.status === 'hired' ? 'default' :
                      rec.status === 'rejected' ? 'destructive' :
                      'secondary'
                    } className="text-xs whitespace-nowrap">
                      {rec.status === 'accepted' || rec.status === 'hired' ? 'Принят' :
                       rec.status === 'rejected' ? 'Отклонён' :
                       'На рассмотрении'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Icon name="Calendar" size={14} />
                        <span className="whitespace-nowrap">{new Date(rec.date).toLocaleDateString('ru-RU')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Award" size={14} />
                        <span className="whitespace-nowrap">{rec.reward.toLocaleString()} ₽</span>
                      </div>
                    </div>
                    {rec.status === 'pending' && (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(rec.id, 'rejected');
                        }} disabled={isSubscriptionExpired} className="flex-1 sm:flex-none text-xs sm:text-sm">
                          <Icon name="X" className="sm:mr-1" size={14} />
                          <span className="hidden sm:inline">Отклонить</span>
                        </Button>
                        <Button size="sm" onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(rec.id, 'accepted');
                        }} disabled={isSubscriptionExpired} className="flex-1 sm:flex-none text-xs sm:text-sm">
                          <Icon name="Check" className="sm:mr-1" size={14} />
                          <span className="hidden sm:inline">Принять</span>
                        </Button>
                      </div>
                    )}
                    {(rec.status === 'accepted' || rec.status === 'hired') && (
                      <div className="flex gap-2 items-center">
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          <Icon name="Clock" size={14} className="inline mr-1" />
                          <span className="hidden sm:inline">Выплата через 30 дней</span>
                          <span className="sm:hidden">30 дн.</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Отменить принятие кандидата? Статус вернётся в "На рассмотрении".')) {
                              onUpdateStatus(rec.id, 'pending');
                            }
                          }}
                          disabled={isSubscriptionExpired}
                          className="text-xs"
                        >
                          <Icon name="RotateCcw" className="sm:mr-1" size={14} />
                          <span className="hidden sm:inline">Отменить</span>
                        </Button>
                      </div>
                    )}
                    {rec.status === 'rejected' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Вернуть кандидата на рассмотрение?')) {
                            onUpdateStatus(rec.id, 'pending');
                          }
                        }}
                        disabled={isSubscriptionExpired}
                        className="text-xs"
                      >
                        <Icon name="RotateCcw" className="mr-1" size={14} />
                        На рассмотрение
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default RecommendationsTab;