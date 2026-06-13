import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface RecommendationForm {
  name: string;
  email: string;
  phone: string;
  comment: string;
}

interface RecommendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacancyTitle?: string;
  form: RecommendationForm;
  onFormChange: (form: RecommendationForm) => void;
  onSubmit: () => void;
}

export function RecommendDialog({
  open,
  onOpenChange,
  vacancyTitle,
  form,
  onFormChange,
  onSubmit,
}: RecommendDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Рекомендовать кандидата</DialogTitle>
          <DialogDescription>
            Заполните информацию о кандидате на вакансию{' '}
            {vacancyTitle && <strong>{vacancyTitle}</strong>}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="recommend-name">ФИО кандидата *</Label>
            <Input
              id="recommend-name"
              placeholder="Иван Иванов"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="recommend-email">Email *</Label>
            <Input
              id="recommend-email"
              type="email"
              placeholder="ivan@example.com"
              value={form.email}
              onChange={(e) => onFormChange({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="recommend-phone">Телефон</Label>
            <Input
              id="recommend-phone"
              type="tel"
              placeholder="+7 (999) 123-45-67"
              value={form.phone}
              onChange={(e) => onFormChange({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="recommend-comment">Комментарий</Label>
            <Textarea
              id="recommend-comment"
              placeholder="Расскажите о кандидате и почему он подходит на эту позицию..."
              rows={4}
              value={form.comment}
              onChange={(e) => onFormChange({ ...form, comment: e.target.value })}
            />
          </div>
          <Button className="w-full" onClick={onSubmit}>
            <Icon name="Send" className="mr-2" size={18} />
            Отправить рекомендацию
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
