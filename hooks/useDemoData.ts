'use client';

import { useEffect, useState } from 'react';
import { repo } from '@/services/storage';
import type { ChatMessage, ReportCard, Student, StudyPlan } from '@/types/models';

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

export function useStudent() {
  const hydrated = useHydrated();
  const [student, setStudent] = useState<Student | null>(null);
  useEffect(() => {
    setStudent(repo.student());
  }, []);
  return { hydrated, student, setStudent };
}

export function useReport() {
  const hydrated = useHydrated();
  const [report, setReport] = useState<ReportCard | null>(null);
  useEffect(() => {
    setReport(repo.report());
  }, []);
  return { hydrated, report, setReport };
}

export function useChatHistory() {
  const hydrated = useHydrated();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  useEffect(() => {
    setMessages(repo.chat());
  }, []);
  return { hydrated, messages, setMessages };
}

export function useStudyPlan() {
  const hydrated = useHydrated();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  useEffect(() => {
    setPlan(repo.plan());
  }, []);
  return { hydrated, plan, setPlan };
}
