import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface InviteForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  position: string;
  department: string;
}

interface InviteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: InviteForm;
  onFormChange: (form: InviteForm) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function InviteEmployeeDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  isLoading,
}: InviteEmployeeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить сотрудника</DialogTitle>
          <DialogDescription>Создайте аккаунт для нового сотрудника компании</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="invite-first-name">Имя</Label>
            <Input
              id="invite-first-name"
              placeholder="Иван"
              value={form.firstName}
              onChange={(e) => onFormChange({ ...form, firstName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="invite-last-name">Фамилия</Label>
            <Input
              id="invite-last-name"
              placeholder="Иванов"
              value={form.lastName}
              onChange={(e) => onFormChange({ ...form, lastName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="ivan@company.ru"
              value={form.email}
              onChange={(e) => onFormChange({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="invite-password">Пароль</Label>
            <Input
              id="invite-password"
              type="password"
              placeholder="Минимум 8 символов"
              value={form.password}
              onChange={(e) => onFormChange({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="invite-position">Должность</Label>
            <Input
              id="invite-position"
              placeholder="Frontend Developer"
              value={form.position}
              onChange={(e) => onFormChange({ ...form, position: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="invite-department">Отдел</Label>
            <Input
              id="invite-department"
              placeholder="Разработка"
              value={form.department}
              onChange={(e) => onFormChange({ ...form, department: e.target.value })}
            />
          </div>
          <Button className="w-full" onClick={onSubmit} disabled={isLoading}>
            {isLoading ? 'Создание...' : 'Создать аккаунт сотрудника'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
