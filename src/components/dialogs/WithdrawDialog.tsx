import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import type { WalletData } from '@/lib/api';
import type { Company } from '@/lib/api';

export interface WithdrawForm {
  amount: string;
  paymentMethod: string;
  paymentDetails: string;
  bankName: string;
  accountFullName: string;
  accountBank: string;
  accountNumber: string;
  accountBik: string;
}

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: WithdrawForm;
  onFormChange: (form: WithdrawForm) => void;
  walletData: WalletData | null;
  company: Company | null;
  onSubmit: () => void;
}

export function WithdrawDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  walletData,
  company,
  onSubmit,
}: WithdrawDialogProps) {
  const balance = walletData?.wallet?.wallet_balance || 0;
  const isOverBalance = !!form.amount && parseFloat(form.amount) > balance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Запрос на выплату</DialogTitle>
          <DialogDescription>
            Доступно для вывода: {balance.toLocaleString()} ₽
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Сумма</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => onFormChange({ ...form, amount: String(balance) })}
              >
                Вывести всё
              </Button>
            </div>
            <Input
              type="number"
              placeholder="Введите сумму"
              value={form.amount}
              onChange={(e) => onFormChange({ ...form, amount: e.target.value })}
              max={balance}
              min={0}
              className={isOverBalance ? 'border-red-500' : ''}
            />
            <p className={`text-xs mt-1 ${isOverBalance ? 'text-red-500' : 'text-muted-foreground'}`}>
              {isOverBalance ? 'Сумма превышает доступный баланс! ' : ''}
              Максимальная сумма: {balance.toLocaleString()} ₽
            </p>
          </div>

          <div>
            <Label>Способ выплаты</Label>
            <Select
              value={form.paymentMethod}
              onValueChange={(v) => onFormChange({ ...form, paymentMethod: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(company?.payout_methods ?? ['card', 'sbp', 'bank', 'cash']).map((m) => {
                  const labels: Record<string, { icon: string; text: string }> = {
                    card: { icon: 'CreditCard', text: 'Банковская карта' },
                    sbp: { icon: 'Smartphone', text: 'СБП' },
                    bank: { icon: 'Landmark', text: 'По реквизитам на счёт' },
                    cash: { icon: 'Banknote', text: 'Наличными' },
                  };
                  const info = labels[m] ?? { icon: 'Wallet', text: m };
                  return (
                    <SelectItem key={m} value={m}>
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name={info.icon} size={14} />
                        {info.text}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {form.paymentMethod === 'bank' ? (
            <>
              <div>
                <Label>ФИО получателя <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Иванов Иван Иванович"
                  value={form.accountFullName}
                  onChange={(e) => onFormChange({ ...form, accountFullName: e.target.value })}
                />
              </div>
              <div>
                <Label>Банк получателя <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="ПАО Сбербанк"
                  value={form.accountBank}
                  onChange={(e) => onFormChange({ ...form, accountBank: e.target.value })}
                />
              </div>
              <div>
                <Label>Расчётный счёт <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="40817810099910004312"
                  value={form.accountNumber}
                  onChange={(e) => onFormChange({ ...form, accountNumber: e.target.value })}
                  maxLength={20}
                />
              </div>
              <div>
                <Label>БИК <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="044525225"
                  value={form.accountBik}
                  onChange={(e) => onFormChange({ ...form, accountBik: e.target.value })}
                  maxLength={9}
                />
              </div>
            </>
          ) : form.paymentMethod === 'cash' ? (
            <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3 flex items-center gap-2">
              <Icon name="Banknote" size={16} className="shrink-0" />
              Выплата будет произведена наличными. Уточните детали у вашего работодателя.
            </p>
          ) : (
            <>
              <div>
                <Label>ФИО держателя карты <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Иванов Иван Иванович"
                  value={form.accountFullName}
                  onChange={(e) => onFormChange({ ...form, accountFullName: e.target.value })}
                />
              </div>
              <div>
                <Label>
                  {form.paymentMethod === 'card' ? 'Номер банковской карты' : 'Номер телефона СБП'}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder={form.paymentMethod === 'card' ? '2202 **** **** ****' : '+7 (900) 123-45-67'}
                  value={form.paymentDetails}
                  onChange={(e) => onFormChange({ ...form, paymentDetails: e.target.value })}
                />
              </div>
              <div>
                <Label>Наименование банка <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="ПАО Сбербанк"
                  value={form.bankName || ''}
                  onChange={(e) => onFormChange({ ...form, bankName: e.target.value })}
                />
              </div>
            </>
          )}

          <Button className="w-full" onClick={onSubmit}>
            Отправить запрос
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}