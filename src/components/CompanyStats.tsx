import React, { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Recommendation, Employee, Vacancy } from '@/types';

interface CompanyStatsProps {
  recommendations: Recommendation[];
  employees: Employee[];
  vacancies: Vacancy[];
  companyName?: string;
}

type Period = '7d' | '30d' | '90d' | '180d' | '365d' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': '7 дней',
  '30d': '30 дней',
  '90d': '3 месяца',
  '180d': '6 месяцев',
  '365d': '1 год',
  'all': 'Всё время',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'На рассмотрении',
  interview: 'Собеседование',
  accepted: 'Принят',
  hired: 'Нанят',
  rejected: 'Отклонён',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  interview: '#3b82f6',
  accepted: '#10b981',
  hired: '#059669',
  rejected: '#ef4444',
};

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}М ₽`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}К ₽`;
  return `${n.toLocaleString('ru-RU')} ₽`;
}

function getPeriodStart(period: Period): Date | null {
  if (period === 'all') return null;
  const days = parseInt(period);
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function CompanyStats({ recommendations, employees, vacancies, companyName }: CompanyStatsProps) {
  const [period, setPeriod] = useState<Period>('30d');
  const [exporting, setExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const periodStart = useMemo(() => getPeriodStart(period), [period]);

  const filtered = useMemo(() =>
    periodStart
      ? recommendations.filter(r => new Date(r.date) >= periodStart)
      : recommendations,
    [recommendations, periodStart]
  );

  const prevFiltered = useMemo(() => {
    if (period === 'all') return [];
    const days = parseInt(period);
    const end = periodStart!;
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    return recommendations.filter(r => {
      const d = new Date(r.date);
      return d >= start && d < end;
    });
  }, [recommendations, period, periodStart]);

  const totalRecs = filtered.length;
  const prevTotalRecs = prevFiltered.length;
  const growth = prevTotalRecs > 0 ? Math.round(((totalRecs - prevTotalRecs) / prevTotalRecs) * 100) : null;

  const accepted = filtered.filter(r => r.status === 'accepted' || r.status === 'hired').length;
  const conversion = totalRecs > 0 ? Math.round((accepted / totalRecs) * 100) : 0;

  const totalReward = filtered
    .filter(r => r.status === 'accepted' || r.status === 'hired')
    .reduce((s, r) => s + (parseFloat(String(r.reward)) || 0), 0);

  const pending = filtered.filter(r => r.status === 'pending').length;
  const interview = filtered.filter(r => r.status === 'interview').length;
  const rejected = filtered.filter(r => r.status === 'rejected').length;

  const activeEmployees = employees.filter(e => !e.isFired).length;
  const activeVacancies = vacancies.filter(v => v.status === 'active').length;

  const statusData = [
    { name: 'На рассмотрении', value: pending, color: STATUS_COLORS.pending },
    { name: 'Собеседование', value: interview, color: STATUS_COLORS.interview },
    { name: 'Принят/Нанят', value: accepted, color: STATUS_COLORS.accepted },
    { name: 'Отклонён', value: rejected, color: STATUS_COLORS.rejected },
  ].filter(d => d.value > 0);

  const byVacancy = useMemo(() => {
    const map: Record<string, { name: string; count: number; accepted: number }> = {};
    filtered.forEach(r => {
      const k = r.vacancy || 'Без вакансии';
      if (!map[k]) map[k] = { name: k, count: 0, accepted: 0 };
      map[k].count++;
      if (r.status === 'accepted' || r.status === 'hired') map[k].accepted++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [filtered]);

  const byMonth = useMemo(() => {
    const map: Record<string, { month: string; count: number; accepted: number }> = {};
    (period === 'all' || parseInt(period) >= 90 ? recommendations : filtered).forEach(r => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
      if (!map[key]) map[key] = { month: label, count: 0, accepted: 0 };
      map[key].count++;
      if (r.status === 'accepted' || r.status === 'hired') map[key].accepted++;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v).slice(-12);
  }, [recommendations, filtered, period]);

  const topEmployees = useMemo(() => {
    const map: Record<number, { emp: Employee; count: number; accepted: number; reward: number }> = {};
    filtered.forEach(r => {
      if (!r.employeeId) return;
      if (!map[r.employeeId]) {
        const emp = employees.find(e => e.id === r.employeeId);
        if (!emp) return;
        map[r.employeeId] = { emp, count: 0, accepted: 0, reward: 0 };
      }
      map[r.employeeId].count++;
      if (r.status === 'accepted' || r.status === 'hired') {
        map[r.employeeId].accepted++;
        map[r.employeeId].reward += parseFloat(String(r.reward)) || 0;
      }
    });
    return Object.values(map).sort((a, b) => b.accepted - a.accepted || b.count - a.count).slice(0, 10);
  }, [filtered, employees]);

  const avgTimeToAccept = useMemo(() => {
    const times = filtered
      .filter(r => (r.status === 'accepted' || r.status === 'hired') && r.acceptedDate)
      .map(r => {
        const created = new Date(r.date).getTime();
        const accepted = new Date(r.acceptedDate!).getTime();
        return (accepted - created) / (1000 * 60 * 60 * 24);
      })
      .filter(d => d >= 0);
    return times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
  }, [filtered]);

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      const pageH = pdf.internal.pageSize.getHeight();
      let y = 0;
      while (y < pdfH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -y, pdfW, pdfH);
        y += pageH;
      }
      const label = PERIOD_LABELS[period].replace(' ', '_');
      pdf.save(`Статистика_${companyName || 'компания'}_${label}.pdf`);
    } catch (e) {
      console.error('PDF export error', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
          <span>📊</span> Статистика по компании
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={period} onValueChange={v => setPeriod(v as Period)}>
            <SelectTrigger className="w-36 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
                <SelectItem key={p} value={p}>{PERIOD_LABELS[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting}>
            <Icon name={exporting ? 'Loader2' : 'Download'} size={16} className={`mr-2 ${exporting ? 'animate-spin' : ''}`} />
            Скачать PDF
          </Button>
        </div>
      </div>

      <div ref={printRef} className="space-y-6 bg-white p-1">
        {exporting && (
          <div className="text-center py-2 text-sm text-muted-foreground">
            {companyName} · Период: {PERIOD_LABELS[period]} · {new Date().toLocaleDateString('ru-RU')}
          </div>
        )}

        {/* Основные KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardDescription className="text-xs">Рекомендаций</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl sm:text-3xl font-bold">{totalRecs}</div>
              {growth !== null && (
                <p className={`text-xs mt-1 font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {growth >= 0 ? '▲' : '▼'} {Math.abs(growth)}% к прошлому периоду
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardDescription className="text-xs">Принято/Нанято</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl sm:text-3xl font-bold">{accepted}</div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Конверсия</span><span className="font-semibold text-foreground">{conversion}%</span>
                </div>
                <Progress value={conversion} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardDescription className="text-xs">Сумма вознаграждений</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl sm:text-3xl font-bold">{fmtMoney(totalReward)}</div>
              {avgTimeToAccept !== null && (
                <p className="text-xs text-muted-foreground mt-1">Ср. срок найма: {avgTimeToAccept} дн.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardDescription className="text-xs">Сотрудники / Вакансии</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl sm:text-3xl font-bold">{activeEmployees}</div>
              <p className="text-xs text-muted-foreground mt-1">{activeVacancies} активных вакансий</p>
            </CardContent>
          </Card>
        </div>

        {/* Дополнительные метрики */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'На рассмотрении', value: pending, color: 'text-amber-600 bg-amber-50' },
            { label: 'На собеседовании', value: interview, color: 'text-blue-600 bg-blue-50' },
            { label: 'Отклонено', value: rejected, color: 'text-red-600 bg-red-50' },
            { label: 'Всего вакансий', value: vacancies.length, color: 'text-purple-600 bg-purple-50' },
          ].map(m => (
            <div key={m.label} className={`rounded-lg p-3 ${m.color}`}>
              <div className="text-2xl font-bold">{m.value}</div>
              <div className="text-xs mt-0.5 opacity-80">{m.label}</div>
            </div>
          ))}
        </div>

        {/* График по месяцам */}
        {byMonth.length > 1 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Динамика рекомендаций</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={byMonth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v, n) => [v, n === 'count' ? 'Всего' : 'Принято']} />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} name="count" />
                  <Line type="monotone" dataKey="accepted" stroke="#10b981" strokeWidth={2} dot={false} name="accepted" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-center">
                <span className="text-xs flex items-center gap-1"><span className="w-4 h-0.5 bg-indigo-500 inline-block" /> Всего</span>
                <span className="text-xs flex items-center gap-1"><span className="w-4 h-0.5 bg-emerald-500 inline-block" /> Принято</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {/* Статусы (pie) */}
          {statusData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Распределение по статусам</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={statusData} cx={65} cy={65} innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={2}>
                        {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, _, p) => [v, p.payload.name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 flex-1">
                    {statusData.map(s => (
                      <div key={s.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                          <span className="text-muted-foreground">{s.name}</span>
                        </div>
                        <span className="font-semibold">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* По вакансиям */}
          {byVacancy.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">По вакансиям</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={byVacancy} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                    <Tooltip formatter={(v, n) => [v, n === 'count' ? 'Всего' : 'Принято']} />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 3, 3, 0]} name="count" />
                    <Bar dataKey="accepted" fill="#10b981" radius={[0, 3, 3, 0]} name="accepted" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Топ рекрутёров */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Топ рекрутёров за период</CardTitle>
            <CardDescription className="text-xs">{PERIOD_LABELS[period]}</CardDescription>
          </CardHeader>
          <CardContent>
            {topEmployees.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">Нет данных за выбранный период</p>
            ) : (
              <div className="space-y-3">
                {topEmployees.map(({ emp, count, accepted: acc, reward }, idx) => (
                  <div key={emp.id} className="flex items-center gap-3">
                    <div className={`text-sm font-bold w-6 text-center shrink-0 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                      #{idx + 1}
                    </div>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={emp.avatar} />
                      <AvatarFallback className="text-xs">{emp.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{emp.name}</div>
                      <div className="text-xs text-muted-foreground">{emp.position}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold">{count} рек. · {acc} принято</div>
                      {reward > 0 && <div className="text-xs text-green-600">{fmtMoney(reward)}</div>}
                    </div>
                    <div className="w-20 hidden sm:block">
                      <div className="text-xs text-muted-foreground mb-0.5">{count > 0 ? Math.round(acc / count * 100) : 0}%</div>
                      <Progress value={count > 0 ? Math.round(acc / count * 100) : 0} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Детальная таблица рекомендаций */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Рекомендации за период</CardTitle>
            <CardDescription className="text-xs">{filtered.length} записей · {PERIOD_LABELS[period]}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Кандидат</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Вакансия</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">Сотрудник</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Статус</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">Дата</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Вознагр.</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 50).map(r => (
                    <tr key={r.id} className="border-b hover:bg-muted/20">
                      <td className="px-4 py-2 font-medium">{r.candidateName}</td>
                      <td className="px-4 py-2 text-muted-foreground truncate max-w-[120px]">{r.vacancy || '—'}</td>
                      <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">{r.recommendedBy || '—'}</td>
                      <td className="px-4 py-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: `${STATUS_COLORS[r.status]}20`, color: STATUS_COLORS[r.status] }}>
                          {STATUS_LABELS[r.status] || r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">{new Date(r.date).toLocaleDateString('ru-RU')}</td>
                      <td className="px-4 py-2 text-right">
                        {(r.status === 'accepted' || r.status === 'hired') && r.reward > 0
                          ? <span className="text-green-600 font-medium">{fmtMoney(parseFloat(String(r.reward)))}</span>
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Нет данных за выбранный период</td></tr>
                  )}
                </tbody>
              </table>
              {filtered.length > 50 && (
                <p className="text-xs text-muted-foreground text-center py-2">Показано 50 из {filtered.length}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
