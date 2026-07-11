'use client';

import { useState } from 'react';
import { Confetti } from '@/components/confetti';
import { Mascot } from '@/components/mascot';
import { Button, Card, Shell } from '@/components/ui';
import { questionBank } from '@/data/demo';
import { pct } from '@/lib/utils';
import { uid } from '@/lib/utils';
import { repo } from '@/services/storage';
import type { MockTestQuestion } from '@/types/models';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'General Knowledge', 'Any'];
const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = questionBank.length;

const clampCount = (value: number) =>
  Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, Math.round(value) || MIN_QUESTIONS));

function verdictFor(scorePct: number): { emoji: string; message: string } {
  if (scorePct >= 80) return { emoji: '🏆', message: 'Outstanding! You crushed it!' };
  if (scorePct >= 60) return { emoji: '🎉', message: 'Great work — keep it up!' };
  if (scorePct >= 40) return { emoji: '💪', message: 'Good effort — review and retry!' };
  return { emoji: '🌱', message: 'Every attempt makes you stronger!' };
}

/** Animated SVG progress ring for the results screen. */
function ScoreRing({ scorePct }: { scorePct: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" role="img" aria-label={`Score ${scorePct} percent`}>
      <circle cx="64" cy="64" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
      <circle
        cx="64"
        cy="64"
        r={radius}
        fill="none"
        stroke={scorePct >= 60 ? '#14b8a6' : scorePct >= 40 ? '#f59e0b' : '#fb7185'}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - scorePct / 100)}
        transform="rotate(-90 64 64)"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x="64" y="72" textAnchor="middle" className="fill-slate-900 text-2xl font-bold">
        {scorePct}%
      </text>
    </svg>
  );
}

export default function MockTestPage() {
  const [subject, setSubject] = useState('Mathematics');
  const [topic, setTopic] = useState('Algebra');
  const [count, setCount] = useState(3);
  const [questions, setQuestions] = useState<MockTestQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  function generate() {
    const pool = questionBank.filter((question) => question.subject === subject || subject === 'Any');
    setQuestions((pool.length ? pool : questionBank).slice(0, clampCount(count)));
    setAnswers([]);
    setDone(false);
    setCurrent(0);
  }

  function selectAnswer(optionIndex: number) {
    setAnswers((previous) => {
      const next = [...previous];
      next[current] = optionIndex;
      return next;
    });
  }

  const score = questions.reduce(
    (total, question, index) => total + (answers[index] === question.answerIndex ? 1 : 0),
    0,
  );
  const scorePct = pct(score, questions.length);
  const verdict = verdictFor(scorePct);

  function submit() {
    setDone(true);
    repo.saveAttempts([
      ...repo.attempts(),
      { id: uid(), testId: 'local', answers, score, createdAt: new Date().toISOString() },
    ]);
  }

  function reset() {
    setQuestions([]);
    setDone(false);
  }

  const question = questions[current];

  return (
    <Shell>
      <main className="mx-auto max-w-4xl space-y-4 p-4">
        <h1 className="text-3xl font-bold">Mock Test Generator</h1>

        {!questions.length && (
          <Card>
            <div className="grid gap-3 md:grid-cols-5">
              <select
                aria-label="Subject"
                className="rounded border p-3"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              >
                {SUBJECTS.map((item) => <option key={item}>{item}</option>)}
              </select>
              <input
                aria-label="Topic"
                className="rounded border p-3"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              />
              <select aria-label="Difficulty" className="rounded border p-3">
                <option>Easy</option>
                <option>Medium</option>
              </select>
              <input
                aria-label="Number of questions"
                className="rounded border p-3"
                type="number"
                min={MIN_QUESTIONS}
                max={MAX_QUESTIONS}
                value={count}
                onChange={(event) => setCount(clampCount(Number(event.target.value)))}
              />
              <Button onClick={generate}>Generate Test</Button>
            </div>
          </Card>
        )}

        {question && !done && (
          <Card className="animate-pop">
            <div className="flex items-center justify-between">
              <p>
                Question {current + 1} of {questions.length} • {topic}
              </p>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {answers.filter((answer) => answer !== undefined).length}/{questions.length} answered
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-blue-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-violet transition-all duration-300"
                style={{ width: `${((current + 1) / questions.length) * 100}%` }}
              />
            </div>
            <h2 className="my-4 text-xl font-bold">{question.prompt}</h2>
            {question.options.map((option, optionIndex) => (
              <button
                key={option}
                className={`focus-ring my-2 block w-full rounded-xl border p-3 text-left transition hover:border-blue-400 hover:bg-blue-50/50 ${
                  answers[current] === optionIndex ? 'border-blue-600 bg-blue-50 font-semibold' : ''
                }`}
                onClick={() => selectAnswer(optionIndex)}
              >
                {option}
              </button>
            ))}
            <div className="flex justify-between">
              <Button variant="ghost" disabled={!current} onClick={() => setCurrent(current - 1)}>
                Previous
              </Button>
              {current < questions.length - 1 ? (
                <Button onClick={() => setCurrent(current + 1)}>Next</Button>
              ) : (
                <Button onClick={submit}>Submit Test</Button>
              )}
            </div>
          </Card>
        )}

        {done && (
          <Card className="animate-pop relative overflow-visible">
            {scorePct >= 60 && <Confetti />}
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
              <ScoreRing scorePct={scorePct} />
              <div>
                <h2 className="text-2xl font-bold">
                  Results: {score}/{questions.length} {verdict.emoji}
                </h2>
                <p className="text-slate-600">{verdict.message}</p>
              </div>
              <Mascot size={72} className="animate-float sm:ml-auto" />
            </div>
            {questions.map((reviewQuestion, index) => {
              const correct = answers[index] === reviewQuestion.answerIndex;
              return (
                <div
                  key={reviewQuestion.id}
                  className={`my-3 rounded-xl border p-3 ${correct ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}
                >
                  <b>
                    {correct ? '✅ Correct' : '❌ Needs review'}: {reviewQuestion.prompt}
                  </b>
                  <p>Correct answer: {reviewQuestion.options[reviewQuestion.answerIndex]}</p>
                  <p>{reviewQuestion.explanation}</p>
                </div>
              );
            })}
            <Button onClick={reset}>Retry the test</Button>
          </Card>
        )}
      </main>
    </Shell>
  );
}
