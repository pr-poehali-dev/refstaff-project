import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ResetPasswordForm {
  token: string;
  password: string;
  confirmPassword: string;
}

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ResetPasswordForm;
  onFormChange: (form: ResetPasswordForm) => void;
  message: string;
  onSubmit: () => void;
  isLoading?: boolean;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  message,
  onSubmit,
  isLoading,
}: ResetPasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый пароль</DialogTitle>
          <DialogDescription>
            Введите новый пароль для вашего аккаунта
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="new-password">Новый пароль</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Минимум 6 символов"
              value={form.password}
              onChange={(e) => onFormChange({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Подтвердите пароль</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Введите пароль еще раз"
              value={form.confirmPassword}
              onChange={(e) => onFormChange({ ...form, confirmPassword: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            />
          </div>
          {message && (
            <div className={`text-sm p-3 rounded ${
              message.includes('успешно')
                ? 'text-green-600 bg-green-50'
                : 'text-red-600 bg-red-50'
            }`}>
              {message}
            </div>
          )}
          <Button
            className="w-full"
            onClick={onSubmit}
            disabled={!form.password || !form.confirmPassword || isLoading}
          >
            Сохранить пароль
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
