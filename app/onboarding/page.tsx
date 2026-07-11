'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Shell } from '@/components/ui';
import { repo } from '@/services/storage';
import type { Student } from '@/types/models';

const schema = z.object({
  name: z.string().min(2),
  age: z.coerce.number().min(8),
  classGrade: z.string().min(1),
  board: z.string().min(2),
  country: z.string().min(2),
  subjects: z.string().min(2),
  strong: z.string().min(2),
  weak: z.string().min(2),
  interests: z.string().min(2),
  careers: z.string().min(2),
  hours: z.coerce.number().min(1),
  goal: z.string().min(5),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

const STEPS: ReadonlyArray<ReadonlyArray<keyof FormInput>> = [
  ['name', 'age', 'classGrade', 'board'],
  ['country', 'subjects', 'strong', 'weak'],
  ['interests', 'careers', 'hours', 'goal'],
];

const splitList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const { register, handleSubmit, trigger, formState: { errors } } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { country: 'India', board: 'CBSE', classGrade: '10', hours: 14 },
  });

  function save(values: FormOutput) {
    const student: Student = {
      id: 'local',
      name: values.name,
      age: values.age,
      academic: {
        classGrade: values.classGrade,
        board: values.board,
        country: values.country,
        subjects: splitList(values.subjects),
        strongSubjects: splitList(values.strong),
        improvementSubjects: splitList(values.weak),
      },
      interests: splitList(values.interests),
      careerInterests: splitList(values.careers),
      weeklyStudyHours: values.hours,
      goal: values.goal,
      notifications: true,
      theme: 'system',
    };
    repo.saveStudent(student);
    router.push('/dashboard');
  }

  async function next() {
    const valid = await trigger(STEPS[step] as Array<keyof FormInput>);
    if (valid) setStep(step + 1);
  }

  return (
    <Shell>
      <main className="mx-auto max-w-2xl p-4">
        <Card>
          <h1 className="text-3xl font-bold">Create your student profile</h1>
          <div className="my-4 h-2 rounded bg-blue-100">
            <div className="h-2 rounded bg-blue-600" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          <form onSubmit={handleSubmit(save)} className="space-y-4">
            {STEPS[step].map((field) => (
              <label key={field} className="block capitalize">
                {field}
                <input
                  className="mt-1 w-full rounded-xl border p-3"
                  {...register(field)}
                  aria-invalid={!!errors[field]}
                />
                {errors[field] && <span className="text-sm text-red-600">Required</span>}
              </label>
            ))}
            <div className="flex justify-between">
              <Button type="button" variant="ghost" disabled={!step} onClick={() => setStep(step - 1)}>
                Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={() => void next()}>Next</Button>
              ) : (
                <Button type="submit">Finish onboarding</Button>
              )}
            </div>
          </form>
        </Card>
      </main>
    </Shell>
  );
}
