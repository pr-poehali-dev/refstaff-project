import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import type { Company } from '@/lib/api';

export interface CompanyEditForm {
  description: string;
  website: string;
  industry: string;
  telegram: string;
  vk: string;
}

interface CompanySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  form: CompanyEditForm;
  onFormChange: (form: CompanyEditForm) => void;
  logoPreview: string | null;
  onLogoFileChange: (file: File) => void;
  onLogoRemove: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export function CompanySettingsDialog({
  open,
  onOpenChange,
  company,
  form,
  onFormChange,
  logoPreview,
  onLogoFileChange,
  onLogoRemove,
  onSave,
  isSaving,
}: CompanySettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-16px)] max-w-2xl max-h-[92dvh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
          <DialogTitle className="text-base">Профиль компании</DialogTitle>
          <DialogDescription className="text-xs">Управляйте информацией о вашей компании</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <div>
            <Label htmlFor="company-name-edit" className="text-xs">Название компании</Label>
            <Input
              id="company-name-edit"
              className="mt-1 h-9 text-sm"
              value={company?.name || ''}
              readOnly
              disabled
            />
          </div>
          <div>
            <Label htmlFor="company-logo" className="text-xs">Логотип</Label>
            <div className="mt-1 flex items-center gap-3">
              {(logoPreview || company?.logo_url) && (
                <div className="relative shrink-0">
                  <img
                    src={logoPreview || company?.logo_url}
                    alt="Логотип"
                    className="h-10 w-10 object-contain rounded border"
                    loading="lazy"
                    decoding="async"
                  />
                  <button
                    type="button"
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none hover:bg-red-700"
                    onClick={onLogoRemove}
                    title="Удалить логотип"
                  ><Icon name="X" size={10} /></button>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Input
                  id="company-logo"
                  className="text-xs h-9"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        alert('Файл слишком большой. Максимум 5 МБ');
                        e.target.value = '';
                        return;
                      }
                      onLogoFileChange(file);
                    }
                  }}
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, WebP до 5 МБ, от 200×200 пикселей</p>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="company-desc" className="text-xs">Описание</Label>
            <Textarea
              id="company-desc"
              rows={2}
              className="mt-1 text-sm"
              placeholder="Расскажите о вашей компании..."
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="company-website" className="text-xs">Веб-сайт</Label>
              <Input
                id="company-website"
                className="mt-1 h-9 text-sm"
                placeholder="https://example.com"
                value={form.website}
                onChange={(e) => onFormChange({ ...form, website: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="company-industry" className="text-xs">Отрасль</Label>
              <Select value={form.industry} onValueChange={(val) => onFormChange({ ...form, industry: val })}>
                <SelectTrigger className="mt-1 h-9 text-sm">
                  <SelectValue placeholder="Выберите" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech">IT и технологии</SelectItem>
                  <SelectItem value="finance">Финансы</SelectItem>
                  <SelectItem value="retail">Розничная торговля</SelectItem>
                  <SelectItem value="manufacturing">Производство</SelectItem>
                  <SelectItem value="services">Услуги</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="company-inn" className="text-xs">ИНН</Label>
              <Input
                id="company-inn"
                className="mt-1 h-9 text-sm"
                value={company?.inn || ''}
                readOnly
                disabled
              />
            </div>
            <div>
              <Label htmlFor="company-employee-count" className="text-xs">Сотрудников</Label>
              <Input
                id="company-employee-count"
                className="mt-1 h-9 text-sm"
                type="number"
                value={company?.employee_count || 0}
                readOnly
                disabled
              />
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-xs font-semibold mb-2">Социальные сети</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="company-telegram" className="text-xs flex items-center gap-1">
                  <Icon name="Send" size={12} /> Telegram
                </Label>
                <Input
                  id="company-telegram"
                  className="mt-1 h-9 text-sm"
                  placeholder="@company"
                  value={form.telegram}
                  onChange={(e) => onFormChange({ ...form, telegram: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="company-vk" className="text-xs flex items-center gap-1">
                  <Icon name="MessageCircle" size={12} /> ВКонтакте
                </Label>
                <Input
                  id="company-vk"
                  className="mt-1 h-9 text-sm"
                  placeholder="vk.com/company"
                  value={form.vk}
                  onChange={(e) => onFormChange({ ...form, vk: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 border-t shrink-0">
          <Button className="w-full" onClick={onSave} disabled={isSaving}>
            <Icon
              name={isSaving ? 'Loader2' : 'Save'}
              className={`mr-2 ${isSaving ? 'animate-spin' : ''}`}
              size={16}
            />
            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}