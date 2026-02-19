import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ─── Memory Game ────────────────────────────────────────────────────────────

const EMOJIS = ['🚀', '⭐', '💎', '🎯', '🔥', '🏆', '💡', '🎁'];

function MemoryGame() {
  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(() => {
    const s = localStorage.getItem('memory_best');
    return s ? parseInt(s) : null;
  });

  const init = useCallback(() => {
    const pairs = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setCards(pairs);
    setSelected([]);
    setMoves(0);
    setWon(false);
  }, []);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (selected.length === 2) {
      const [a, b] = selected;
      if (cards[a].emoji === cards[b].emoji) {
        setCards(prev => prev.map((c, i) => i === a || i === b ? { ...c, matched: true } : c));
        setSelected([]);
      } else {
        const t = setTimeout(() => {
          setCards(prev => prev.map((c, i) => i === a || i === b ? { ...c, flipped: false } : c));
          setSelected([]);
        }, 900);
        return () => clearTimeout(t);
      }
    }
  }, [selected, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.matched)) {
      setWon(true);
      if (bestScore === null || moves < bestScore) {
        setBestScore(moves);
        localStorage.setItem('memory_best', String(moves));
      }
    }
  }, [cards, moves, bestScore]);

  const flip = (i: number) => {
    if (selected.length === 2 || cards[i].flipped || cards[i].matched) return;
    setCards(prev => prev.map((c, idx) => idx === i ? { ...c, flipped: true } : c));
    setSelected(prev => [...prev, i]);
    if (selected.length === 1) setMoves(m => m + 1);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">🃏 Memory</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">Ходов: {moves}</Badge>
            {bestScore !== null && <Badge variant="secondary">Рекорд: {bestScore}</Badge>}
            <Button size="sm" variant="ghost" onClick={init}>↺ Заново</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {won ? (
          <div className="text-center py-6 space-y-3">
            <p className="text-4xl">🎉</p>
            <p className="font-semibold text-lg">Победа за {moves} ходов!</p>
            {bestScore === moves && <Badge className="bg-yellow-500 text-white">Новый рекорд!</Badge>}
            <Button onClick={init}>Играть ещё</Button>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {cards.map((card, i) => (
              <button
                key={card.id}
                onClick={() => flip(i)}
                className={`aspect-square rounded-lg text-2xl flex items-center justify-center transition-all duration-300 border-2 select-none
                  ${card.flipped || card.matched
                    ? 'bg-primary/10 border-primary/30 scale-95'
                    : 'bg-muted border-muted-foreground/20 hover:border-primary/50 hover:scale-105 cursor-pointer'
                  }
                  ${card.matched ? 'opacity-50' : ''}
                `}
              >
                {card.flipped || card.matched ? card.emoji : '❓'}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Reaction Game ───────────────────────────────────────────────────────────

function ReactionGame() {
  const [state, setState] = useState<'idle' | 'waiting' | 'ready' | 'done' | 'early'>('idle');
  const [time, setTime] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(() => {
    const s = localStorage.getItem('reaction_best');
    return s ? parseInt(s) : null;
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<number>(0);

  const start = () => {
    setState('waiting');
    const delay = 2000 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      setState('ready');
      startRef.current = Date.now();
    }, delay);
  };

  const click = () => {
    if (state === 'waiting') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState('early');
      return;
    }
    if (state === 'ready') {
      const elapsed = Date.now() - startRef.current;
      setTime(elapsed);
      setState('done');
      if (best === null || elapsed < best) {
        setBest(elapsed);
        localStorage.setItem('reaction_best', String(elapsed));
      }
    }
  };

  const reset = () => { setState('idle'); setTime(null); };

  const bgMap: Record<string, string> = {
    idle: 'bg-muted hover:bg-muted/80',
    waiting: 'bg-red-500/20 cursor-pointer',
    ready: 'bg-green-500 cursor-pointer animate-pulse',
    done: 'bg-blue-500/20',
    early: 'bg-orange-500/20',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">⚡ Реакция</CardTitle>
          {best !== null && <Badge variant="secondary">Рекорд: {best} мс</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <button
          onClick={state === 'idle' || state === 'done' || state === 'early' ? start : click}
          className={`w-full h-36 rounded-xl text-center transition-all duration-200 font-medium text-lg select-none ${bgMap[state]}`}
        >
          {state === 'idle' && '👆 Нажми, чтобы начать'}
          {state === 'waiting' && '⏳ Жди зелёного...'}
          {state === 'ready' && '🟢 ЖМИ!'}
          {state === 'early' && <span>😅 Слишком рано! <br /><span className="text-sm text-muted-foreground">Нажми для повтора</span></span>}
          {state === 'done' && time !== null && (
            <span>
              {time} мс {best === time && <span className="ml-1">🏆</span>}
              <br /><span className="text-sm text-muted-foreground">Нажми для повтора</span>
            </span>
          )}
        </button>
        {(state === 'done' || state === 'early') && (
          <Button size="sm" variant="ghost" onClick={reset} className="mt-3">↺ Сброс</Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Guess Number ────────────────────────────────────────────────────────────

function GuessGame() {
  const [secret, setSecret] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [input, setInput] = useState('');
  const [hint, setHint] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [won, setWon] = useState(false);
  const [history, setHistory] = useState<{ n: number; hint: string }[]>([]);

  const reset = () => {
    setSecret(Math.floor(Math.random() * 100) + 1);
    setInput('');
    setHint('');
    setAttempts(0);
    setWon(false);
    setHistory([]);
  };

  const guess = () => {
    const n = parseInt(input);
    if (isNaN(n) || n < 1 || n > 100) { setHint('Введи число от 1 до 100'); return; }
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    let h = '';
    if (n === secret) { setWon(true); h = '🎯 Угадал!'; }
    else if (n < secret) h = n < secret - 20 ? '🔼 Намного больше' : '🔼 Больше';
    else h = n > secret + 20 ? '🔽 Намного меньше' : '🔽 Меньше';
    setHint(h);
    setHistory(prev => [{ n, hint: h }, ...prev]);
    setInput('');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">🔢 Угадай число</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Попыток: {attempts}</Badge>
            <Button size="sm" variant="ghost" onClick={reset}>↺ Заново</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {won ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-4xl">🎯</p>
            <p className="font-semibold">Угадал за {attempts} {attempts === 1 ? 'попытку' : attempts < 5 ? 'попытки' : 'попыток'}!</p>
            <Button onClick={reset}>Играть ещё</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Я загадал число от 1 до 100. Угадай его!</p>
            <div className="flex gap-2">
              <input
                type="number"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && guess()}
                placeholder="Введи число..."
                min={1}
                max={100}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button onClick={guess}>Проверить</Button>
            </div>
            {hint && <p className="text-center font-medium text-base">{hint}</p>}
            {history.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {history.slice(0, 8).map((h, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{h.n} {h.hint.split(' ')[0]}</Badge>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Tic Tac Toe ─────────────────────────────────────────────────────────────

type TTTCell = 'X' | 'O' | null;

function checkWinner(board: TTTCell[]): { winner: TTTCell; line: number[] } | null {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return { winner: board[a], line: [a,b,c] };
  }
  return null;
}

function botMove(board: TTTCell[]): number {
  const empty = board.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
  // Win
  for (const i of empty) {
    const b = [...board]; b[i] = 'O';
    if (checkWinner(b)) return i;
  }
  // Block
  for (const i of empty) {
    const b = [...board]; b[i] = 'X';
    if (checkWinner(b)) return i;
  }
  // Center
  if (board[4] === null) return 4;
  // Corner
  const corners = [0,2,6,8].filter(i => board[i] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return empty[Math.floor(Math.random() * empty.length)];
}

function TicTacToe() {
  const [board, setBoard] = useState<TTTCell[]>(Array(9).fill(null));
  const [isX, setIsX] = useState(true);
  const [scores, setScores] = useState({ you: 0, bot: 0, draw: 0 });
  const [blocked, setBlocked] = useState(false);

  const result = checkWinner(board);
  const isDraw = !result && board.every(Boolean);

  useEffect(() => {
    if (result || isDraw) {
      setScores(s => ({
        you: s.you + (result?.winner === 'X' ? 1 : 0),
        bot: s.bot + (result?.winner === 'O' ? 1 : 0),
        draw: s.draw + (isDraw ? 1 : 0),
      }));
    }
  }, [result, isDraw]);

  useEffect(() => {
    if (!isX && !result && !isDraw) {
      setBlocked(true);
      const t = setTimeout(() => {
        setBoard(prev => {
          const b = [...prev];
          const idx = botMove(b);
          if (idx !== undefined) b[idx] = 'O';
          return b;
        });
        setIsX(true);
        setBlocked(false);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [isX, result, isDraw]);

  const click = (i: number) => {
    if (board[i] || result || blocked || !isX) return;
    const b = [...board]; b[i] = 'X';
    setBoard(b);
    setIsX(false);
  };

  const reset = () => { setBoard(Array(9).fill(null)); setIsX(true); setBlocked(false); };

  const winLine = result?.line ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">❌ Крестики-нолики</CardTitle>
          <div className="flex gap-2 text-xs">
            <Badge className="bg-blue-500 text-white">Вы: {scores.you}</Badge>
            <Badge variant="outline">Ничья: {scores.draw}</Badge>
            <Badge className="bg-red-500 text-white">Бот: {scores.bot}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {(result || isDraw) ? (
          <div className="text-center py-3 space-y-2">
            <p className="text-3xl">{result?.winner === 'X' ? '🎉' : isDraw ? '🤝' : '🤖'}</p>
            <p className="font-semibold">{result?.winner === 'X' ? 'Вы победили!' : isDraw ? 'Ничья!' : 'Бот победил!'}</p>
            <Button size="sm" onClick={reset}>Ещё раз</Button>
          </div>
        ) : (
          <p className="text-sm text-center text-muted-foreground">{isX ? '👆 Ваш ход (X)' : '🤖 Бот думает...'}</p>
        )}
        <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
          {board.map((cell, i) => (
            <button
              key={i}
              onClick={() => click(i)}
              className={`aspect-square rounded-lg text-3xl font-bold flex items-center justify-center border-2 transition-all select-none
                ${winLine.includes(i) ? 'bg-yellow-400/30 border-yellow-400' : 'bg-muted border-muted-foreground/20'}
                ${!cell && !result && isX ? 'hover:bg-primary/10 hover:border-primary/40 cursor-pointer' : 'cursor-default'}
              `}
            >
              <span className={cell === 'X' ? 'text-blue-500' : 'text-red-500'}>{cell}</span>
            </button>
          ))}
        </div>
        {(result || isDraw) && null}
      </CardContent>
    </Card>
  );
}

// ─── Snake ───────────────────────────────────────────────────────────────────

const COLS = 20;
const ROWS = 16;
type Pos = { x: number; y: number };

function SnakeGame() {
  const [snake, setSnake] = useState<Pos[]>([{ x: 10, y: 8 }]);
  const [dir, setDir] = useState<Pos>({ x: 1, y: 0 });
  const [food, setFood] = useState<Pos>({ x: 15, y: 8 });
  const [running, setRunning] = useState(false);
  const [dead, setDead] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('snake_best') || '0'));
  const dirRef = useRef(dir);
  const snakeRef = useRef(snake);
  dirRef.current = dir;
  snakeRef.current = snake;

  const spawnFood = useCallback((s: Pos[]) => {
    let f: Pos;
    do { f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
    while (s.some(p => p.x === f.x && p.y === f.y));
    return f;
  }, []);

  const reset = useCallback(() => {
    const s = [{ x: 10, y: 8 }];
    setSnake(s);
    setDir({ x: 1, y: 0 });
    setFood(spawnFood(s));
    setScore(0);
    setDead(false);
    setRunning(false);
  }, [spawnFood]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      const d = dirRef.current;
      const s = snakeRef.current;
      const head = { x: (s[0].x + d.x + COLS) % COLS, y: (s[0].y + d.y + ROWS) % ROWS };
      if (s.some(p => p.x === head.x && p.y === head.y)) {
        setDead(true);
        setRunning(false);
        return;
      }
      const ate = head.x === food.x && head.y === food.y;
      const newSnake = [head, ...s.slice(0, ate ? undefined : s.length - 1)];
      setSnake(newSnake);
      if (ate) {
        setScore(sc => {
          const ns = sc + 1;
          setBest(b => {
            if (ns > b) { localStorage.setItem('snake_best', String(ns)); return ns; }
            return b;
          });
          return ns;
        });
        setFood(spawnFood(newSnake));
      }
    }, 120);
    return () => clearInterval(interval);
  }, [running, food, spawnFood]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = dirRef.current;
      if (e.key === 'ArrowUp' && d.y !== 1) { e.preventDefault(); setDir({ x: 0, y: -1 }); }
      if (e.key === 'ArrowDown' && d.y !== -1) { e.preventDefault(); setDir({ x: 0, y: 1 }); }
      if (e.key === 'ArrowLeft' && d.x !== 1) { e.preventDefault(); setDir({ x: -1, y: 0 }); }
      if (e.key === 'ArrowRight' && d.x !== -1) { e.preventDefault(); setDir({ x: 1, y: 0 }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const swipe = useRef<Pos | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!swipe.current) return;
    const dx = e.changedTouches[0].clientX - swipe.current.x;
    const dy = e.changedTouches[0].clientY - swipe.current.y;
    const d = dirRef.current;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 20 && d.x !== -1) setDir({ x: 1, y: 0 });
      if (dx < -20 && d.x !== 1) setDir({ x: -1, y: 0 });
    } else {
      if (dy > 20 && d.y !== -1) setDir({ x: 0, y: 1 });
      if (dy < -20 && d.y !== 1) setDir({ x: 0, y: -1 });
    }
    swipe.current = null;
  };

  const cellSize = 'calc(100% / 20)';

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">🐍 Змейка</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Счёт: {score}</Badge>
            <Badge variant="secondary">Рекорд: {best}</Badge>
            <Button size="sm" variant="ghost" onClick={reset}>↺ Заново</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className="relative bg-muted rounded-lg overflow-hidden border border-muted-foreground/20 touch-none"
          style={{ paddingTop: `${(ROWS / COLS) * 100}%` }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="absolute inset-0">
            {snake.map((p, i) => (
              <div key={i} className={`absolute rounded-sm ${i === 0 ? 'bg-green-500' : 'bg-green-400'}`}
                style={{ left: `${(p.x / COLS) * 100}%`, top: `${(p.y / ROWS) * 100}%`, width: cellSize, height: `calc(100% / ${ROWS})` }} />
            ))}
            <div className="absolute text-sm flex items-center justify-center"
              style={{ left: `${(food.x / COLS) * 100}%`, top: `${(food.y / ROWS) * 100}%`, width: cellSize, height: `calc(100% / ${ROWS})` }}>🍎</div>
          </div>
          {!running && !dead && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
              <Button onClick={() => setRunning(true)}>▶ Начать</Button>
            </div>
          )}
          {dead && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 rounded-lg">
              <p className="text-white font-bold text-lg">💀 Игра окончена! Счёт: {score}</p>
              <Button onClick={reset}>Заново</Button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1 max-w-[140px] mx-auto">
          <div />
          <Button size="sm" variant="outline" onClick={() => dir.y !== 1 && setDir({ x: 0, y: -1 })}>▲</Button>
          <div />
          <Button size="sm" variant="outline" onClick={() => dir.x !== 1 && setDir({ x: -1, y: 0 })}>◀</Button>
          <Button size="sm" variant="outline" onClick={() => running ? setRunning(false) : setRunning(true)}>{running ? '⏸' : '▶'}</Button>
          <Button size="sm" variant="outline" onClick={() => dir.x !== -1 && setDir({ x: 1, y: 0 })}>▶</Button>
          <div />
          <Button size="sm" variant="outline" onClick={() => dir.y !== -1 && setDir({ x: 0, y: 1 })}>▼</Button>
          <div />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Tetris ──────────────────────────────────────────────────────────────────

const T_COLS = 10;
const T_ROWS = 20;
type Board = (string | null)[][];

const PIECES = [
  { shape: [[1,1,1,1]], color: '#06b6d4' },
  { shape: [[1,1],[1,1]], color: '#eab308' },
  { shape: [[0,1,0],[1,1,1]], color: '#a855f7' },
  { shape: [[1,0],[1,0],[1,1]], color: '#f97316' },
  { shape: [[0,1],[0,1],[1,1]], color: '#3b82f6' },
  { shape: [[0,1,1],[1,1,0]], color: '#22c55e' },
  { shape: [[1,1,0],[0,1,1]], color: '#ef4444' },
];

type Piece = { shape: number[][]; color: string; x: number; y: number };

function emptyBoard(): Board { return Array.from({ length: T_ROWS }, () => Array(T_COLS).fill(null)); }

function rotatePiece(shape: number[][]): number[][] {
  return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
}

function isValid(board: Board, piece: Piece, ox = 0, oy = 0): boolean {
  for (let y = 0; y < piece.shape.length; y++)
    for (let x = 0; x < piece.shape[y].length; x++)
      if (piece.shape[y][x]) {
        const nx = piece.x + x + ox, ny = piece.y + y + oy;
        if (nx < 0 || nx >= T_COLS || ny >= T_ROWS) return false;
        if (ny >= 0 && board[ny][nx]) return false;
      }
  return true;
}

function placePiece(board: Board, piece: Piece): Board {
  const b = board.map(r => [...r]);
  for (let y = 0; y < piece.shape.length; y++)
    for (let x = 0; x < piece.shape[y].length; x++)
      if (piece.shape[y][x] && piece.y + y >= 0)
        b[piece.y + y][piece.x + x] = piece.color;
  return b;
}

function clearLines(board: Board): { board: Board; lines: number } {
  const kept = board.filter(row => row.some(c => !c));
  const cleared = T_ROWS - kept.length;
  const newBoard = [...Array.from({ length: cleared }, () => Array(T_COLS).fill(null)), ...kept];
  return { board: newBoard, lines: cleared };
}

function randomPiece(): Piece {
  const p = PIECES[Math.floor(Math.random() * PIECES.length)];
  return { ...p, shape: p.shape.map(r => [...r]), x: Math.floor(T_COLS / 2) - 1, y: -p.shape.length };
}

function TetrisGame() {
  const [board, setBoard] = useState<Board>(emptyBoard());
  const [current, setCurrent] = useState<Piece | null>(null);
  const [next, setNext] = useState<Piece>(randomPiece());
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('tetris_best') || '0'));

  const boardRef = useRef(board);
  const currentRef = useRef(current);
  boardRef.current = board;
  currentRef.current = current;

  const spawn = useCallback((b: Board, piece: Piece) => {
    if (!isValid(b, piece)) { setOver(true); setRunning(false); return false; }
    setCurrent(piece);
    return true;
  }, []);

  const reset = useCallback(() => {
    const b = emptyBoard();
    setBoard(b);
    setScore(0);
    setLines(0);
    setOver(false);
    setRunning(false);
    const p = randomPiece();
    setCurrent(p);
    setNext(randomPiece());
  }, []);

  useEffect(() => { reset(); }, [reset]);

  const lock = useCallback(() => {
    const c = currentRef.current;
    const b = boardRef.current;
    if (!c) return;
    const placed = placePiece(b, c);
    const { board: cleared, lines: l } = clearLines(placed);
    setBoard(cleared);
    setLines(prev => prev + l);
    const pts = [0, 100, 300, 500, 800][l] || 0;
    setScore(prev => {
      const ns = prev + pts;
      setBest(bst => { if (ns > bst) { localStorage.setItem('tetris_best', String(ns)); return ns; } return bst; });
      return ns;
    });
    const n = next;
    setNext(randomPiece());
    spawn(cleared, n);
  }, [next, spawn]);

  useEffect(() => {
    if (!running || !current) return;
    const speed = Math.max(100, 500 - Math.floor(lines / 10) * 40);
    const interval = setInterval(() => {
      const c = currentRef.current;
      const b = boardRef.current;
      if (!c) return;
      if (isValid(b, c, 0, 1)) setCurrent({ ...c, y: c.y + 1 });
      else lock();
    }, speed);
    return () => clearInterval(interval);
  }, [running, current, lines, lock]);

  const move = useCallback((dx: number, dy: number) => {
    const c = currentRef.current;
    const b = boardRef.current;
    if (!c || !running) return;
    if (isValid(b, c, dx, dy)) setCurrent({ ...c, x: c.x + dx, y: c.y + dy });
    else if (dy > 0) lock();
  }, [running, lock]);

  const rotate = useCallback(() => {
    const c = currentRef.current;
    const b = boardRef.current;
    if (!c || !running) return;
    const rotated = { ...c, shape: rotatePiece(c.shape) };
    if (isValid(b, rotated)) setCurrent(rotated);
  }, [running]);

  const hardDrop = useCallback(() => {
    const c = currentRef.current;
    const b = boardRef.current;
    if (!c || !running) return;
    let drop = c;
    while (isValid(b, drop, 0, 1)) drop = { ...drop, y: drop.y + 1 };
    setCurrent(drop);
    setTimeout(() => lock(), 0);
  }, [running, lock]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1, 0); }
      if (e.key === 'ArrowRight') { e.preventDefault(); move(1, 0); }
      if (e.key === 'ArrowDown') { e.preventDefault(); move(0, 1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); rotate(); }
      if (e.key === ' ') { e.preventDefault(); hardDrop(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, rotate, hardDrop]);

  const renderBoard = (): Board => {
    if (!current) return board;
    return placePiece(board, current);
  };

  const rendered = renderBoard();

  const cellPx = 24;

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">🧱 Тетрис</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Счёт: {score}</Badge>
            <Badge variant="outline">Линий: {lines}</Badge>
            <Badge variant="secondary">Рекорд: {best}</Badge>
            <Button size="sm" variant="ghost" onClick={reset}>↺ Заново</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 items-start justify-center flex-wrap">
          <div className="relative border border-muted-foreground/30 rounded"
            style={{ width: T_COLS * cellPx, height: T_ROWS * cellPx, background: '#0f172a' }}>
            {rendered.map((row, y) => row.map((cell, x) => cell ? (
              <div key={`${y}-${x}`} className="absolute rounded-sm"
                style={{ left: x * cellPx + 1, top: y * cellPx + 1, width: cellPx - 2, height: cellPx - 2, background: cell, boxShadow: `inset 2px 2px 4px rgba(255,255,255,0.3)` }} />
            ) : null))}
            {!running && !over && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                <Button onClick={() => setRunning(true)}>▶ Начать</Button>
              </div>
            )}
            {over && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 rounded">
                <p className="text-white font-bold">Игра окончена!</p>
                <p className="text-white text-sm">Счёт: {score}</p>
                <Button onClick={reset}>Заново</Button>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Следующая</p>
              <div className="border border-muted-foreground/20 rounded p-2 bg-muted/30"
                style={{ width: 5 * cellPx, height: 4 * cellPx, position: 'relative' }}>
                {next.shape.map((row, y) => row.map((cell, x) => cell ? (
                  <div key={`${y}-${x}`} className="absolute rounded-sm"
                    style={{ left: (x + 0.5) * cellPx, top: (y + 0.5) * cellPx, width: cellPx - 2, height: cellPx - 2, background: next.color }} />
                ) : null))}
              </div>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="font-medium">Управление</p>
              <p>← → движение</p>
              <p>↑ поворот</p>
              <p>↓ вниз</p>
              <p>Пробел сброс</p>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div />
              <Button size="sm" variant="outline" onClick={rotate}>↻</Button>
              <div />
              <Button size="sm" variant="outline" onClick={() => move(-1, 0)}>◀</Button>
              <Button size="sm" variant="outline" onClick={() => move(0, 1)}>▼</Button>
              <Button size="sm" variant="outline" onClick={() => move(1, 0)}>▶</Button>
              <div />
              <Button size="sm" variant="outline" onClick={hardDrop} className="col-span-1">⬇</Button>
              <div />
            </div>
            <Button size="sm" variant="outline" onClick={() => setRunning(r => !r)}>{running ? '⏸ Пауза' : '▶ Играть'}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────

export default function GamesTab() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="md:col-span-2">
        <MemoryGame />
      </div>
      <ReactionGame />
      <GuessGame />
      <TicTacToe />
      <SnakeGame />
      <TetrisGame />
    </div>
  );
}
