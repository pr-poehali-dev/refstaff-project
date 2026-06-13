import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onEmailChange: (email: string) => void;
  message: string;
  onMessageChange: (msg: string) => void;
  onSubmit: () => void;
  onBackToLogin: () => void;
  isLoading?: boolean;
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  email,
  onEmailChange,
  message,
  onMessageChange,
  onSubmit,
  onBackToLogin,
  isLoading,
}: ForgotPasswordDialogProps) {
  const handleOpenChange = (val: boolean) => {
    onOpenChange(val);
    if (!val) {
      onEmailChange('');
      onMessageChange('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Восстановление пароля</DialogTitle>
          <DialogDescription>
            Введите email, и мы отправим вам ссылку для восстановления пароля
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            />
          </div>
          {message && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
              {message}
            </div>
          )}
          <Button
            className="w-full"
            onClick={onSubmit}
            disabled={!email.trim() || isLoading}
          >
            Отправить ссылку
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={onBackToLogin}
          >
            Назад к входу
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
