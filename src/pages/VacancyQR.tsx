import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export default function VacancyQR() {
  const { vacancyId } = useParams<{ vacancyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const referralLink: string =
    (location.state as { referralLink?: string })?.referralLink ||
    `${window.location.origin}/vacancy/${vacancyId}`;

  const downloadQR = () => {
    const svg = document.getElementById('vacancy-qr-svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 400, 400);
      const a = document.createElement('a');
      a.download = `qr-vacancy-${vacancyId}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <Button variant="ghost" className="flex items-center gap-2 -ml-2" onClick={() => navigate(-1)}>
          <Icon name="ArrowLeft" size={18} />
          Вернуться назад
        </Button>

        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold">QR-код вакансии</h1>
          <p className="text-sm text-muted-foreground">Отсканируйте для перехода на страницу вакансии</p>
        </div>

        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-2xl border shadow-sm">
            <QRCodeSVG
              id="vacancy-qr-svg"
              value={referralLink}
              size={240}
              includeMargin={false}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center break-all">{referralLink}</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => {
              navigator.clipboard.writeText(referralLink);
            }}>
              <Icon name="Copy" size={14} className="mr-2" />
              Копировать ссылку
            </Button>
            <Button variant="outline" className="flex-1" onClick={downloadQR}>
              <Icon name="Download" size={14} className="mr-2" />
              Скачать PNG
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}