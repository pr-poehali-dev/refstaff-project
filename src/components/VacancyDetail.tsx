import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import type { Vacancy } from '@/types';
import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { VacancyTestManager } from '@/components/VacancyTestManager';

interface VacancyDetailProps {
  vacancy: Vacancy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecommend?: () => void;
  onRestore?: (id: number) => void;
  showRecommendButton?: boolean;
  showPublicLink?: boolean;
}

export function VacancyDetail({ vacancy, open, onOpenChange, onRecommend, onRestore, showRecommendButton = true, showPublicLink = true }: VacancyDetailProps) {
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  const downloadQR = () => {
    const svg = qrRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 300, 300);
      const a = document.createElement('a');
      a.download = `qr-vacancy-${vacancy?.id}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
  };

  if (!vacancy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-16px)] max-w-3xl max-h-[92dvh] overflow-y-auto p-3 sm:p-4">
        <DialogHeader className="pb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="text-base sm:text-xl">{vacancy.title}</DialogTitle>
            <Badge variant={vacancy.status === 'active' ? 'default' : 'secondary'}>
              {vacancy.status === 'active' ? 'Активна' : 'Архив'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Icon name="DollarSign" size={14} />
                <span>Зарплата</span>
              </div>
              <p className="text-base font-bold">{vacancy.salary}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Icon name="Award" size={14} />
                <span>Вознаграждение</span>
              </div>
              <p className="text-base font-bold text-green-600">{vacancy.reward.toLocaleString()} ₽</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Icon name="Clock" size={14} />
                <span>Срок выплаты</span>
              </div>
              <p className="text-sm">
                Через {vacancy.payoutDelayDays} {vacancy.payoutDelayDays === 1 ? 'день' : vacancy.payoutDelayDays < 5 ? 'дня' : 'дней'} после найма
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Icon name="Users" size={14} />
                <span>Статус</span>
              </div>
              <p className="text-sm">
                {vacancy.status === 'active' ? 'Открыт набор' : 'В архиве'}
              </p>
            </div>
          </div>

          <Separator />

          {vacancy.companyDescription ? (
            <div className="space-y-1.5">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Icon name="Building2" size={16} />
                О компании
              </h3>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">{vacancy.companyDescription}</p>
            </div>
          ) : null}

          {vacancy.description ? (
            <>
              {vacancy.companyDescription && <Separator />}
              <div className="space-y-1.5">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Icon name="FileText" size={16} />
                  Описание вакансии
                </h3>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">{vacancy.description}</p>
              </div>
            </>
          ) : null}

          {vacancy.requirements ? (
            <>
              {(vacancy.companyDescription || vacancy.description) && <Separator />}
              <div className="space-y-1.5">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Icon name="ClipboardList" size={16} />
                  Требования
                </h3>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">{vacancy.requirements}</p>
              </div>
            </>
          ) : null}

          {vacancy.motivation ? (
            <>
              <Separator />
              <div className="space-y-1.5">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Icon name="Sparkles" size={16} />
                  Мотивация
                </h3>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">{vacancy.motivation}</p>
              </div>
            </>
          ) : null}

          {!vacancy.companyDescription && !vacancy.description && !vacancy.requirements && !vacancy.motivation ? (
            <p className="text-muted-foreground text-sm italic">Описание вакансии не заполнено</p>
          ) : null}

          {showPublicLink && (
            <>
              <Separator />
              <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Icon name="ExternalLink" size={14} />
                  Ссылка на вакансию
                </h3>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/vacancy/${vacancy.id}`}
                    readOnly
                    className="w-full px-2 py-1.5 text-xs border rounded-md bg-background"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/vacancy/${vacancy.id}`)}
                    className="w-full"
                  >
                    <Icon name="Copy" size={14} className="mr-1" />
                    Копировать
                  </Button>
                </div>
              </div>
            </>
          )}

          {vacancy.referralLink && (
            <>
              <Separator />
              <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Icon name="Link" size={14} />
                  Реферальная ссылка
                </h3>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={vacancy.referralLink}
                    readOnly
                    className="w-full px-2 py-1.5 text-xs border rounded-md bg-background"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(vacancy.referralLink || '')}
                      className="flex-1"
                    >
                      <Icon name="Copy" size={14} className="mr-1" />
                      Копировать
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowQR(!showQR)}
                      className="shrink-0"
                    >
                      <Icon name="QrCode" size={14} />
                    </Button>
                  </div>
                </div>
                {showQR && (
                  <div className="flex flex-col items-center gap-3 pt-2">
                    <div className="bg-white p-3 rounded-lg border">
                      <QRCodeSVG
                        ref={qrRef}
                        value={vacancy.referralLink}
                        size={180}
                        includeMargin={false}
                      />
                    </div>
                    <Button size="sm" variant="outline" onClick={downloadQR}>
                      <Icon name="Download" size={14} className="mr-2" />
                      Скачать PNG
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {vacancy.status === 'archived' && onRestore && (
            <Button className="w-full" size="lg" variant="outline" onClick={() => onRestore(vacancy.id)}>
              <Icon name="RotateCcw" size={18} className="mr-2" />
              Активировать вакансию
            </Button>
          )}

          {showRecommendButton && vacancy.status === 'active' && onRecommend && (
            <Button className="w-full" size="lg" onClick={onRecommend}>
              <Icon name="UserPlus" size={18} className="mr-2" />
              Рекомендовать кандидата
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}