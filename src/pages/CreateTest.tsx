import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'https://functions.poehali.dev/fd243fcc-16df-4dfc-9fc2-cfc319999128';

interface Question {
  id: number;
  text: string;
  options: string[];
  correct_index: number;
}

interface PublicTest {
  id: number;
  token: string;
  job_title: string;
  difficulty: string;
  questions_count: number;
  questions: Question[];
  is_active: boolean;
}

const DIFFICULTY_LABEL: Record<string, string> = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' };
const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  hard: 'bg-red-100 text-red-700 border-red-200',
};

type Step = 'form' | 'editor' | 'done';

export default function CreateTest() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('form');
  const [test, setTest] = useState<PublicTest | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Форма
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [employerEmail, setEmployerEmail] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionsCount, setQuestionsCount] = useState(10);

  const handleGenerate = async () => {
    if (!jobTitle.trim() || !employerEmail.trim()) {
      toast({ title: 'Заполните название вакансии и email', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const r = await fetch(`${API_URL}?action=generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: jobTitle,
          job_description: jobDescription,
          employer_email: employerEmail,
          difficulty,
          questions_count: questionsCount,
        }),
      });
      const data = await r.json();
      if (r.status === 429) {
        toast({ title: data.error, variant: 'destructive' });
        return;
      }
      if (data.error) throw new Error(data.error);
      setTest(data);
      setQuestions(data.questions || []);
      setStep('editor');
    } catch (e) {
      toast({ title: 'Ошибка генерации', description: String(e), variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!test) return;
    setSaving(true);
    try {
      const r = await fetch(`${API_URL}?action=update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: test.token, questions }),
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setTest(data);
      setStep('done');
      toast({ title: 'Тест сохранён!' });
    } catch (e) {
      toast({ title: 'Ошибка сохранения', description: String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateQuestion = (idx: number, field: keyof Question, value: unknown) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateOption = (qi: number, oi: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qi) return q;
      const opts = [...q.options];
      opts[oi] = value;
      return { ...q, options: opts };
    }));
  };

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const addQuestion = () => {
    const newId = Math.max(0, ...questions.map(q => q.id)) + 1;
    setQuestions(prev => [...prev, { id: newId, text: '', options: ['', '', '', ''], correct_index: 0 }]);
  };

  const testLink = test ? `${window.location.origin}/test-public/${test.token}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(testLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Ссылка скопирована!' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Шапка */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="bg-gradient-to-r from-primary to-secondary p-1.5 rounded-lg">
              <Icon name="Rocket" size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">iHUNT</span>
          </a>
          <span className="text-sm text-muted-foreground">Конструктор тестов</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ШАГ 1: ФОРМА */}
        {step === 'form' && (
          <>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Создать тест для кандидата</h1>
              <p className="text-muted-foreground text-sm">ИИ сгенерирует вопросы по вашей вакансии. Результаты придут на email в PDF.</p>
            </div>

            <div className="bg-white rounded-2xl border p-6 space-y-5">
              <div className="space-y-1.5">
                <Label>Название вакансии <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Например: Менеджер по продажам"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Описание вакансии <span className="text-muted-foreground text-xs">(необязательно, но улучшает качество)</span></Label>
                <Textarea
                  placeholder="Опишите обязанности, требования к кандидату, стек технологий..."
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Ваш email для получения результатов <span className="text-red-500">*</span></Label>
                <Input
                  type="email"
                  placeholder="hr@company.ru"
                  value={employerEmail}
                  onChange={e => setEmployerEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">После прохождения теста каждым кандидатом вам придёт PDF с подробным разбором</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Сложность</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'medium', 'hard'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`text-xs py-2 rounded-lg border transition-all ${
                          difficulty === d ? DIFFICULTY_COLOR[d] + ' font-semibold' : 'border-border text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        {DIFFICULTY_LABEL[d]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Количество вопросов</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map(n => (
                      <button
                        key={n}
                        onClick={() => setQuestionsCount(n)}
                        className={`text-xs py-2 rounded-lg border transition-all ${
                          questionsCount === n ? 'bg-primary text-primary-foreground border-primary font-semibold' : 'border-border text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={generating || !jobTitle.trim() || !employerEmail.trim()}
              >
                {generating ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Генерирую вопросы...
                  </>
                ) : (
                  <>
                    <Icon name="Sparkles" size={16} className="mr-2" />
                    Создать тест с ИИ
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">Лимит: 3 теста в день с одного устройства</p>
            </div>
          </>
        )}

        {/* ШАГ 2: РЕДАКТОР */}
        {step === 'editor' && test && (
          <>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setStep('form')}>
                <Icon name="ArrowLeft" size={18} />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Редактор теста</h1>
                <p className="text-xs text-muted-foreground">{test.job_title} · <Badge variant="outline" className={`text-xs ${DIFFICULTY_COLOR[test.difficulty]}`}>{DIFFICULTY_LABEL[test.difficulty]}</Badge></p>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((q, qi) => (
                <div key={q.id} className="bg-white rounded-xl border p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-muted-foreground mt-2 w-5 shrink-0">{qi + 1}.</span>
                    <Textarea
                      value={q.text}
                      onChange={e => updateQuestion(qi, 'text', e.target.value)}
                      placeholder="Текст вопроса"
                      rows={2}
                      className="resize-none text-sm flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-red-500"
                      onClick={() => removeQuestion(qi)}
                    >
                      <Icon name="Trash2" size={15} />
                    </Button>
                  </div>
                  <div className="space-y-2 ml-7">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuestion(qi, 'correct_index', oi)}
                          className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
                            q.correct_index === oi ? 'bg-green-500 border-green-500' : 'border-border hover:border-green-400'
                          }`}
                        />
                        <Input
                          value={opt}
                          onChange={e => updateOption(qi, oi, e.target.value)}
                          placeholder={`Вариант ${oi + 1}`}
                          className="text-sm h-8"
                        />
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">● — правильный ответ</p>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full" onClick={addQuestion}>
                <Icon name="Plus" size={15} className="mr-2" />
                Добавить вопрос
              </Button>

              <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
                {saving ? 'Сохраняем...' : 'Сохранить и получить ссылку'}
              </Button>
            </div>
          </>
        )}

        {/* ШАГ 3: ССЫЛКА ГОТОВА */}
        {step === 'done' && test && (
          <>
            <div className="text-center space-y-2 pt-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Icon name="CheckCircle" size={32} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-bold">Тест готов!</h1>
              <p className="text-muted-foreground text-sm">Отправьте ссылку кандидатам. Результаты каждого придут вам на <strong>{employerEmail}</strong> в виде PDF.</p>
            </div>

            <div className="bg-white rounded-2xl border p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Ссылка для кандидатов</Label>
                <div className="flex gap-2">
                  <Input value={testLink} readOnly className="text-xs bg-muted" />
                  <Button variant="outline" size="icon" onClick={copyLink} className="shrink-0">
                    <Icon name={copied ? 'Check' : 'Copy'} size={15} className={copied ? 'text-green-600' : ''} />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Icon name="Mail" size={18} className="text-blue-600 shrink-0" />
                <p className="text-xs text-blue-800">
                  После каждого прохождения вы получите письмо с PDF, где видны все ответы кандидата — правильные и неправильные.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setStep('editor')}>
                  <Icon name="Pencil" size={14} className="mr-2" />
                  Редактировать
                </Button>
                <Button onClick={copyLink}>
                  <Icon name="Link" size={14} className="mr-2" />
                  {copied ? 'Скопировано!' : 'Скопировать ссылку'}
                </Button>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => { setStep('form'); setTest(null); setJobTitle(''); setJobDescription(''); setEmployerEmail(''); }}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Создать ещё один тест
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}