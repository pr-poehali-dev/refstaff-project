import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface DemoForm {
  companyName: string;
  name: string;
  phone: string;
  email: string;
  employeeCount: string;
}

interface DemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: DemoForm;
  onFormChange: (form: DemoForm) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function DemoDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  isSubmitting,
}: DemoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Запросить доступ</DialogTitle>
          <DialogDescription>Заполните форму и мы свяжемся с вами в ближайшее время</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div>
            <Label htmlFor="demo-company" className="text-sm">
              Наименование компании <span className="text-destructive">*</span>
            </Label>
            <Input
              id="demo-company"
              className="mt-1"
              placeholder="Acme Corp"
              value={form.companyName}
              onChange={(e) => onFormChange({ ...form, companyName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="demo-name" className="text-sm">
              Имя <span className="text-destructive">*</span>
            </Label>
            <Input
              id="demo-name"
              className="mt-1"
              placeholder="Иван Иванов"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="demo-phone" className="text-sm">
              Номер телефона <span className="text-destructive">*</span>
            </Label>
            <Input
              id="demo-phone"
              className="mt-1"
              type="tel"
              placeholder="+7 (999) 123-45-67"
              value={form.phone}
              onChange={(e) => onFormChange({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="demo-email" className="text-sm">
              Почта <span className="text-destructive">*</span>
            </Label>
            <Input
              id="demo-email"
              className="mt-1"
              type="email"
              placeholder="ivan@company.ru"
              value={form.email}
              onChange={(e) => onFormChange({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="demo-count" className="text-sm">Количество сотрудников</Label>
            <Input
              id="demo-count"
              className="mt-1"
              placeholder="100"
              value={form.employeeCount}
              onChange={(e) => onFormChange({ ...form, employeeCount: e.target.value })}
            />
          </div>
          <Button className="w-full mt-2" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <><Icon name="Loader2" className="mr-2 animate-spin" size={16} />Отправка...</>
            ) : (
              <><Icon name="Send" className="mr-2" size={16} />Отправить заявку</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
