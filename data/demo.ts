import type { CareerCluster, ChatMessage, MockTestQuestion, Student, SubjectMark } from '@/types/models';

export const demoStudent: Student = {
  id: 'demo',
  name: 'Aarav Sharma',
  age: 15,
  academic: {
    classGrade: '10',
    board: 'CBSE',
    country: 'India',
    subjects: ['Mathematics', 'Science', 'English', 'Social Science', 'Computer Science'],
    strongSubjects: ['Mathematics', 'Computer Science'],
    improvementSubjects: ['Chemistry', 'English writing'],
  },
  interests: ['Technology', 'problem solving', 'robotics', 'cricket'],
  careerInterests: ['Engineering', 'AI', 'Robotics'],
  weeklyStudyHours: 14,
  goal: 'Score above 90% in board examinations',
  notifications: true,
  theme: 'system',
};

export const demoMarks: SubjectMark[] = [
  { subject: 'Mathematics', obtained: 92, maximum: 100 },
  { subject: 'Science', obtained: 84, maximum: 100 },
  { subject: 'English', obtained: 76, maximum: 100 },
  { subject: 'Social Science', obtained: 88, maximum: 100 },
  { subject: 'Computer Science', obtained: 95, maximum: 100 },
  { subject: 'Chemistry', obtained: 72, maximum: 100 },
];

export const demoChat: ChatMessage[] = [
  {
    id: 'c1',
    role: 'mentor',
    content:
      'Hi Aarav! I can help with concepts, plans, quizzes, and career exploration. AI guidance should be reviewed with parents, teachers, or qualified counselors.',
    createdAt: new Date().toISOString(),
  },
];

export const questionBank: MockTestQuestion[] = [
  {
    id: 'm1',
    subject: 'Mathematics',
    topic: 'Algebra',
    difficulty: 'Easy',
    type: 'MCQ',
    prompt: 'If 2x + 3 = 11, what is x?',
    options: ['2', '3', '4', '5'],
    answerIndex: 2,
    explanation: 'Subtract 3 to get 2x=8, then divide by 2.',
  },
  {
    id: 'm2',
    subject: 'Mathematics',
    topic: 'Algebra',
    difficulty: 'Medium',
    type: 'MCQ',
    prompt: 'Factor x² - 9.',
    options: ['(x-3)(x+3)', '(x-9)(x+1)', 'x(x-9)', '(x-3)²'],
    answerIndex: 0,
    explanation: 'It is a difference of squares: a²-b²=(a-b)(a+b).',
  },
  {
    id: 's1',
    subject: 'Science',
    topic: 'Photosynthesis',
    difficulty: 'Easy',
    type: 'MCQ',
    prompt: 'Which pigment helps plants absorb light?',
    options: ['Hemoglobin', 'Chlorophyll', 'Keratin', 'Insulin'],
    answerIndex: 1,
    explanation: 'Chlorophyll absorbs light energy for photosynthesis.',
  },
  {
    id: 's2',
    subject: 'Science',
    topic: 'Chemistry',
    difficulty: 'Medium',
    type: 'MCQ',
    prompt: 'What is the pH of a neutral solution at 25°C?',
    options: ['0', '7', '10', '14'],
    answerIndex: 1,
    explanation: 'Neutral solutions have pH 7 at room temperature.',
  },
  {
    id: 'e1',
    subject: 'English',
    topic: 'Grammar',
    difficulty: 'Easy',
    type: 'MCQ',
    prompt: 'Choose the correct sentence.',
    options: ['She go to school.', 'She goes to school.', 'She going school.', 'She gone to school.'],
    answerIndex: 1,
    explanation: 'Singular third person uses “goes”.',
  },
  {
    id: 'g1',
    subject: 'General Knowledge',
    topic: 'India',
    difficulty: 'Easy',
    type: 'MCQ',
    prompt: 'Which is the capital of India?',
    options: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'],
    answerIndex: 1,
    explanation: 'New Delhi is the capital of India.',
  },
];

export const clusters: CareerCluster[] = [
  {
    id: 'eng',
    name: 'Engineering and Technology',
    subjects: ['Mathematics', 'Computer Science', 'Science'],
    skills: ['problem solving', 'coding', 'design thinking'],
    description: 'Build systems, software, machines, and technical solutions.',
  },
  {
    id: 'med',
    name: 'Medicine and Life Sciences',
    subjects: ['Science', 'Chemistry', 'Biology'],
    skills: ['careful observation', 'empathy', 'research'],
    description: 'Explore health, biology, biotechnology, and care pathways.',
  },
  {
    id: 'biz',
    name: 'Business and Management',
    subjects: ['Mathematics', 'English', 'Social Science'],
    skills: ['communication', 'planning', 'analysis'],
    description: 'Create, manage, and grow organizations and products.',
  },
  {
    id: 'design',
    name: 'Design and Creative Fields',
    subjects: ['English', 'Computer Science'],
    skills: ['creativity', 'visual thinking', 'user empathy'],
    description: 'Shape experiences, media, products, and communication.',
  },
  {
    id: 'research',
    name: 'Research and Academia',
    subjects: ['Science', 'Mathematics', 'English'],
    skills: ['curiosity', 'writing', 'experimentation'],
    description: 'Investigate questions deeply and teach or publish knowledge.',
  },
  {
    id: 'law',
    name: 'Public Service and Law',
    subjects: ['Social Science', 'English'],
    skills: ['reasoning', 'ethics', 'public communication'],
    description: 'Serve communities through policy, governance, and justice.',
  },
];
