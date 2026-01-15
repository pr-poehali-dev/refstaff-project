import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import type { Recommendation } from '@/types';

interface CandidateDetailProps {
  recommendation: Recommendation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CandidateDetail({ recommendation, open, onOpenChange }: CandidateDetailProps) {
  if (!recommendation) return null;

  const getStatusInfo = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; color: string }> = {
      pending: { label: 'На рассмотрении', variant: 'secondary', color: 'text-yellow-600' },
      interview: { label: 'На интервью', variant: 'default', color: 'text-blue-600' },
      hired: { label: 'Принят', variant: 'outline', color: 'text-green-600' },
      rejected: { label: 'Отклонён', variant: 'destructive', color: 'text-red-600' },
    };
    return config[status] || config.pending;
  };

  const statusInfo = getStatusInfo(recommendation.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{recommendation.candidateName}</DialogTitle>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon name="Briefcase" size={16} />
                <span>{recommendation.vacancyTitle || recommendation.vacancy}</span>
              </div>
            </div>
            <Badge variant={statusInfo.variant}>
              {statusInfo.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon name="Mail" size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{recommendation.candidateEmail}</p>
              </div>
            </div>

            {recommendation.candidatePhone && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon name="Phone" size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Телефон</p>
                  <p className="font-medium">{recommendation.candidatePhone}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon name="Calendar" size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Дата рекомендации</p>
                <p className="font-medium">{new Date(recommendation.date).toLocaleDateString('ru-RU', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Icon name="Award" size={20} className="text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Вознаграждение</p>
                <p className="font-medium text-green-600 text-xl">{recommendation.reward.toLocaleString()} ₽</p>
              </div>
            </div>
          </div>

          {recommendation.comment && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Icon name="MessageSquare" size={18} />
                  Комментарий
                </h3>
                <p className="text-muted-foreground">{recommendation.comment}</p>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Icon name="Activity" size={18} />
              Статус обработки
            </h3>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className={`text-3xl ${statusInfo.color}`}>
                {recommendation.status === 'pending' && '⏳'}
                {recommendation.status === 'interview' && '💼'}
                {recommendation.status === 'hired' && '✅'}
                {recommendation.status === 'rejected' && '❌'}
              </div>
              <div className="flex-1">
                <p className="font-medium">{statusInfo.label}</p>
                <p className="text-sm text-muted-foreground">
                  {recommendation.status === 'pending' && 'Кандидат на рассмотрении у работодателя'}
                  {recommendation.status === 'interview' && 'Кандидат приглашен на интервью'}
                  {recommendation.status === 'hired' && 'Кандидат принят на работу! Вознаграждение будет начислено согласно условиям'}
                  {recommendation.status === 'rejected' && 'К сожалению, кандидат не прошел отбор'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
