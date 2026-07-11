'use client';

import { useState } from 'react';
import { questionBank } from '@/data/demo';
import { Button, Card, Shell } from '@/components/ui';
import { uid } from '@/lib/utils';
import { repo } from '@/services/storage';
import type { MockTestQuestion } from '@/types/models';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'General Knowledge', 'Any'];
const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = questionBank.length;

const clampCount = (value: number) =>
  Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, Math.round(value) || MIN_QUESTIONS));

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
          <Card>
            <p>
              Question {current + 1} of {questions.length} • {topic}
            </p>
            <h2 className="my-4 text-xl font-bold">{question.prompt}</h2>
            {question.options.map((option, optionIndex) => (
              <button
                key={option}
                className={`my-2 block w-full rounded-xl border p-3 text-left ${answers[current] === optionIndex ? 'border-blue-600 bg-blue-50' : ''}`}
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
          <Card>
            <h2 className="text-2xl font-bold">
              Results: {score}/{questions.length}
            </h2>
            {questions.map((reviewQuestion, index) => (
              <div key={reviewQuestion.id} className="my-3 rounded-xl bg-slate-50 p-3">
                <b>
                  {answers[index] === reviewQuestion.answerIndex ? 'Correct' : 'Needs review'}: {reviewQuestion.prompt}
                </b>
                <p>Correct answer: {reviewQuestion.options[reviewQuestion.answerIndex]}</p>
                <p>{reviewQuestion.explanation}</p>
              </div>
            ))}
            <Button onClick={reset}>Retry the test</Button>
          </Card>
        )}
      </main>
    </Shell>
  );
}
