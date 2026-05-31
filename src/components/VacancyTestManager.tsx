import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const TESTS_URL = 'https://functions.poehali.dev/27e0dd10-7f74-4b7f-8c57-1dbc05cafa17';

interface Question {
  id: number;
  text: string;
  options: string[];
  correct_index: number;
}

interface VacancyTest {
  id: number;
  token: string;
  title: string;
  difficulty: string;
  questions_count: number;
  questions?: Question[];
  is_active: boolean;
  created_at: string;
  results_count?: number;
}

interface TestResult {
  id: number;
  candidate_name: string;
  candidate_email: string | null;
  candidate_phone: string | null;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vacancyId: number;
  vacancyTitle: string;
  companyId: number;
}

const DIFFICULTY_LABEL: Record<string, string> = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' };
const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  hard: 'bg-red-100 text-red-700 border-red-200',
};

export function VacancyTestManager({ open, onOpenChange, vacancyId, vacancyTitle, companyId }: Props) {
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'results'>('list');
  const [tests, setTests] = useState<VacancyTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<VacancyTest | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Форма создания
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionsCount, setQuestionsCount] = useState(10);

  // Редактор вопросов
  const [editQuestions, setEditQuestions] = useState<Question[]>([]);

  const loadTests = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${TESTS_URL}?action=list&vacancy_id=${vacancyId}&company_id=${companyId}`);
      const data = await r.json();
      setTests(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: 'Ошибка загрузки тестов', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) { loadTests(); setView('list'); }
  }, [open, vacancyId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const r = await fetch(`${TESTS_URL}?action=generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacancy_id: vacancyId, company_id: companyId, difficulty, questions_count: questionsCount }),
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setSelectedTest(data);
      setEditQuestions(data.questions || []);
      setView('edit');
      await loadTests();
      toast({ title: 'Тест сгенерирован! Можете редактировать вопросы.' });
    } catch (e) {
      toast({ title: 'Ошибка генерации', description: String(e), variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const openEdit = async (test: VacancyTest) => {
    setLoading(true);
    try {
      const r = await fetch(`${TESTS_URL}?action=get&id=${test.id}&company_id=${companyId}`);
      const data = await r.json();
      setSelectedTest(data);
      setEditQuestions(data.questions || []);
      setView('edit');
    } catch {
      toast({ title: 'Ошибка загрузки теста', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openResults = async (test: VacancyTest) => {
    setSelectedTest(test);
    setLoading(true);
    try {
      const r = await fetch(`${TESTS_URL}?action=results&test_id=${test.id}&company_id=${companyId}`);
      const data = await r.json();
      setResults(Array.isArray(data) ? data : []);
      setView('results');
    } catch {
      toast({ title: 'Ошибка загрузки результатов', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!selectedTest) return;
    setSaving(true);
    try {
      const r = await fetch(`${TESTS_URL}?action=update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTest.id, company_id: companyId, questions: editQuestions }),
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      toast({ title: 'Тест сохранён!' });
      await loadTests();
      setView('list');
    } catch (e) {
      toast({ title: 'Ошибка сохранения', description: String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (test: VacancyTest) => {
    try {
      await fetch(`${TESTS_URL}?action=update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: test.id, company_id: companyId, is_active: !test.is_active }),
      });
      await loadTests();
      toast({ title: test.is_active ? 'Тест деактивирован' : 'Тест активирован' });
    } catch {
      toast({ title: 'Ошибка', variant: 'destructive' });
    }
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/test/${token}`);
    toast({ title: 'Ссылка скопирована!' });
  };

  // --- Редактор вопросов ---
  const updateQuestion = (idx: number, field: keyof Question, value: unknown) => {
    setEditQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateOption = (qi: number, oi: number, value: string) => {
    setEditQuestions(prev => prev.map((q, i) => {
      if (i !== qi) return q;
      const opts = [...q.options];
      opts[oi] = value;
      return { ...q, options: opts };
    }));
  };

  const removeQuestion = (idx: number) => {
    setEditQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const addQuestion = () => {
    const newId = Math.max(0, ...editQuestions.map(q => q.id)) + 1;
    setEditQuestions(prev => [...prev, { id: newId, text: '', options: ['', '', '', ''], correct_index: 0 }]);
  };

  const testLink = selectedTest ? `${window.location.origin}/test/${selectedTest.token}` : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-16px)] max-w-2xl max-h-[92dvh] overflow-y-auto p-4">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {view !== 'list' && (
              <Button variant="ghost" size="icon" className="shrink-0 -ml-1" onClick={() => setView('list')}>
                <Icon name="ArrowLeft" size={18} />
              </Button>
            )}
            <div>
              <DialogTitle className="text-base">
                {view === 'list' && 'Тесты для вакансии'}
                {view === 'create' && 'Создать новый тест'}
                {view === 'edit' && 'Редактор теста'}
                {view === 'results' && 'Результаты теста'}
              </DialogTitle>
              <p className="text-xs text-muted-foreground truncate">{vacancyTitle}</p>
            </div>
          </div>
        </DialogHeader>

        {/* СПИСОК ТЕСТОВ */}
        {view === 'list' && (
          <div className="space-y-4 pt-2">
            <Button className="w-full" onClick={() => setView('create')}>
              <Icon name="Sparkles" size={16} className="mr-2" />
              Создать тест с помощью ИИ
            </Button>

            {loading && <p className="text-center text-muted-foreground text-sm py-4">Загружаем...</p>}

            {!loading && tests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="ClipboardList" size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Тестов ещё нет</p>
              </div>
            )}

            {tests.map(test => (
              <div key={test.id} className="border rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{test.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className={`text-xs ${DIFFICULTY_COLOR[test.difficulty] || ''}`}>
                        {DIFFICULTY_LABEL[test.difficulty] || test.difficulty}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{test.questions_count} вопросов</span>
                      <span className="text-xs text-muted-foreground">· {test.results_count || 0} ответов</span>
                    </div>
                  </div>
                  <Badge variant={test.is_active ? 'default' : 'secondary'} className="text-xs shrink-0">
                    {test.is_active ? 'Активен' : 'Отключён'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button size="sm" variant="outline" className="w-full px-2" onClick={() => copyLink(test.token)}>
                    <Icon name="Copy" size={13} className="mr-1 shrink-0" />
                    <span className="truncate">Ссылка</span>
                  </Button>
                  <Button size="sm" variant="outline" className="w-full px-2" onClick={() => openEdit(test)}>
                    <Icon name="Pencil" size={13} className="mr-1 shrink-0" />
                    <span className="truncate">Изменить</span>
                  </Button>
                  <Button size="sm" variant="outline" className="w-full px-2" onClick={() => openResults(test)}>
                    <Icon name="BarChart2" size={13} className="mr-1 shrink-0" />
                    <span className="truncate">Итоги</span>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(test)} className="shrink-0">
                    <Icon name={test.is_active ? 'EyeOff' : 'Eye'} size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* СОЗДАНИЕ ТЕСТА */}
        {view === 'create' && (
          <div className="space-y-6 pt-2">
            <div className="space-y-3">
              <Label>Уровень сложности</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`py-3 rounded-xl border text-sm font-medium transition-all
                      ${difficulty === d ? `${DIFFICULTY_COLOR[d]} border-current` : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    {DIFFICULTY_LABEL[d]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Количество вопросов</Label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 20, 30].map(n => (
                  <button
                    key={n}
                    onClick={() => setQuestionsCount(n)}
                    className={`py-3 rounded-xl border text-sm font-semibold transition-all
                      ${questionsCount === n ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
              <p className="font-medium mb-1">ИИ сгенерирует тест на основе:</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                <li>Названия и описания вакансии</li>
                <li>Требований к кандидату</li>
                <li>Выбранного уровня сложности</li>
              </ul>
            </div>

            <Button className="w-full" size="lg" onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Генерирую тест...
                </>
              ) : (
                <>
                  <Icon name="Sparkles" size={16} className="mr-2" />
                  Сгенерировать {questionsCount} вопросов
                </>
              )}
            </Button>
          </div>
        )}

        {/* РЕДАКТОР ВОПРОСОВ */}
        {view === 'edit' && selectedTest && (
          <div className="space-y-4 pt-2">
            <div className="bg-muted/50 rounded-xl p-3 space-y-2">
              <p className="text-sm font-medium">Ссылка на тест</p>
              <div className="flex gap-2">
                <Input value={testLink} readOnly className="text-xs flex-1 bg-background" />
                <Button size="sm" variant="outline" onClick={() => copyLink(selectedTest.token)}>
                  <Icon name="Copy" size={14} />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Вопросы ({editQuestions.length})</p>
              <Button size="sm" variant="outline" onClick={addQuestion}>
                <Icon name="Plus" size={14} className="mr-1" />
                Добавить
              </Button>
            </div>

            <div className="space-y-4">
              {editQuestions.map((q, qi) => (
                <div key={q.id} className="border rounded-xl p-4 space-y-3 bg-slate-50/50">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-muted-foreground mt-2 w-5 shrink-0">{qi + 1}</span>
                    <Textarea
                      value={q.text}
                      onChange={e => updateQuestion(qi, 'text', e.target.value)}
                      placeholder="Текст вопроса..."
                      className="flex-1 text-sm min-h-[60px] bg-white"
                    />
                    <Button size="icon" variant="ghost" className="shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50 mt-0.5" onClick={() => removeQuestion(qi)}>
                      <Icon name="Trash2" size={15} />
                    </Button>
                  </div>
                  <div className="space-y-2 pl-7">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuestion(qi, 'correct_index', oi)}
                          className={`w-5 h-5 rounded-full border-2 shrink-0 transition-all
                            ${q.correct_index === oi ? 'border-green-500 bg-green-500' : 'border-slate-300 hover:border-green-400'}`}
                        />
                        <Input
                          value={opt}
                          onChange={e => updateOption(qi, oi, e.target.value)}
                          placeholder={`Вариант ${String.fromCharCode(65 + oi)}`}
                          className={`text-sm h-8 ${q.correct_index === oi ? 'border-green-300 bg-green-50' : 'bg-white'}`}
                        />
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">● — правильный ответ</p>
                  </div>
                </div>
              ))}
            </div>

            <Button className="w-full" size="lg" onClick={saveEdit} disabled={saving}>
              {saving ? 'Сохраняем...' : 'Сохранить тест'}
            </Button>
          </div>
        )}

        {/* РЕЗУЛЬТАТЫ */}
        {view === 'results' && (
          <div className="space-y-4 pt-2">
            {loading && <p className="text-center text-muted-foreground py-6">Загружаем...</p>}

            {!loading && results.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Icon name="Users" size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Пока никто не прошёл этот тест</p>
              </div>
            )}

            {results.map(r => (
              <div key={r.id} className="border rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{r.candidate_name}</p>
                    {r.candidate_phone && <p className="text-xs text-muted-foreground">{r.candidate_phone}</p>}
                    {r.candidate_email && <p className="text-xs text-muted-foreground">{r.candidate_email}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xl font-bold ${r.percentage >= 70 ? 'text-green-600' : r.percentage >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {r.percentage}%
                    </span>
                    <p className="text-xs text-muted-foreground">{r.score}/{r.total_questions}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.completed_at).toLocaleString('ru')}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}