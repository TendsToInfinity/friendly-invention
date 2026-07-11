export type Subject = {
  id: string;
  name: string;
};

export type SubjectMark = {
  subject: string;
  obtained: number;
  maximum: number;
};

export type AcademicProfile = {
  classGrade: string;
  board: string;
  country: string;
  subjects: string[];
  strongSubjects: string[];
  improvementSubjects: string[];
};

export type Student = {
  id: string;
  name: string;
  age: number;
  academic: AcademicProfile;
  interests: string[];
  careerInterests: string[];
  weeklyStudyHours: number;
  goal: string;
  notifications: boolean;
  theme: 'light' | 'system';
};

export type ReportCard = {
  id: string;
  marks: SubjectMark[];
  createdAt: string;
};

export type PerformanceInsight = {
  overall: number;
  strongest: string[];
  improvement: string[];
  summary: string;
};

export type ChatMessage = {
  id: string;
  role: 'student' | 'mentor';
  content: string;
  createdAt: string;
  subject?: string;
};

export type MockTestQuestion = {
  id: string;
  subject: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'MCQ';
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type MockTest = {
  id: string;
  subject: string;
  topic: string;
  questions: MockTestQuestion[];
};

export type MockTestAttempt = {
  id: string;
  testId: string;
  answers: number[];
  score: number;
  createdAt: string;
};

export type StudyTask = {
  id: string;
  day: string;
  title: string;
  subject: string;
  durationMinutes: number;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
};

export type StudyPlan = {
  id: string;
  tasks: StudyTask[];
  generatedAt: string;
};

export type CareerCluster = {
  id: string;
  name: string;
  subjects: string[];
  skills: string[];
  description: string;
};

export type CareerRecommendation = {
  cluster: CareerCluster;
  matchScore: number;
  why: string;
  nextSteps: string[];
};
