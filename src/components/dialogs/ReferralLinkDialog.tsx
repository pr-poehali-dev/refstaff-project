import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QRCodeSVG } from 'qrcode.react';
import Icon from '@/components/ui/icon';

interface ReferralLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralLink: string;
  onCopyLink: (link: string) => void;
}

export function ReferralLinkDialog({
  open,
  onOpenChange,
  referralLink,
  onCopyLink,
}: ReferralLinkDialogProps) {
  const handlePrint = () => {
    const svgEl = document.querySelector('.invite-qr-container svg');
    const svgStr = svgEl ? new XMLSerializer().serializeToString(svgEl) : '';
    const b64 = svgStr ? btoa(unescape(encodeURIComponent(svgStr))) : '';
    const imgSrc = b64 ? `data:image/svg+xml;base64,${b64}` : '';
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Регистрация сотрудника</title><style>*{box-sizing:border-box}body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:32px;text-align:center}h2{font-size:22px;margin-bottom:8px}p{color:#555;font-size:14px;margin-bottom:24px}img{width:220px;height:220px}code{display:block;margin-top:20px;font-size:11px;color:#333;word-break:break-all;max-width:300px}</style></head><body><h2>Регистрация сотрудника</h2><p>Отсканируйте QR-код для регистрации в компании</p>${imgSrc ? `<img src="${imgSrc}" />` : ''}<code>${referralLink}</code></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Регистрация сотрудников</DialogTitle>
          <DialogDescription>
            Поделитесь ссылкой или QR-кодом с новыми сотрудниками для регистрации
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-lg border-2 border-gray-200 invite-qr-container">
              <QRCodeSVG value={referralLink} size={200} level="H" />
            </div>
          </div>

          <div>
            <Label>Ссылка для регистрации</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={referralLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={() => onCopyLink(referralLink)}>
                <Icon name="Copy" size={16} />
              </Button>
              <Button variant="outline" title="Распечатать" onClick={handlePrint}>
                <Icon name="Printer" size={16} />
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Icon name="Info" className="text-blue-600 mt-0.5" size={16} />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Как использовать:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Отправьте ссылку новому сотруднику</li>
                  <li>Покажите QR-код для быстрого сканирования</li>
                  <li>Сотрудник автоматически привяжется к вашей компании</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
