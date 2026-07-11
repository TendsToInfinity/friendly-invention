import { questionBank } from '@/data/demo';
import { analyzePerformance } from '@/lib/analytics';
import type { ChatMessage, SubjectMark } from '@/types/models';

/**
 * Adaptive mentor engine — the deterministic brain behind the AI mentor.
 *
 * It personalizes every answer using the student's own data (name, marks,
 * weak/strong subjects, quiz history) and keeps lightweight conversation
 * state inside message content via HTML comments (DOMPurify strips comments
 * at render time, so students never see them).
 *
 * Used in two places:
 *  - server/ai.ts as the fallback when no LLM key is configured (and as the
 *    error fallback when the LLM call fails);
 *  - services/ai.ts client-side for demo mode.
 */

export type MentorContext = {
  studentName?: string;
  weakSubjects: string[];
  strongSubjects: string[];
  marks: SubjectMark[];
  attemptCount: number;
};

type KnowledgeEntry = {
  id: string;
  subject: string;
  keywords: string[];
  answer: string;
  deepDive: string;
};

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: 'photosynthesis',
    subject: 'Science',
    keywords: ['photosynthesis', 'plants make food', 'chlorophyll'],
    answer:
      '**Photosynthesis** is how plants make their own food. 🌱\n\n- **Ingredients:** sunlight + water + carbon dioxide\n- **Where:** chloroplasts (the green parts, thanks to *chlorophyll*)\n- **Result:** glucose (food) + oxygen (what we breathe!)\n\nMemory trick: **"Light + CO₂ + H₂O → sugar + O₂"**',
    deepDive:
      'Going deeper: photosynthesis has two stages. The **light reactions** capture sunlight and store its energy, and the **Calvin cycle** uses that energy to build glucose from CO₂. That is why plants need light AND air — take either away and the sugar factory stops.',
  },
  {
    id: 'linear-equations',
    subject: 'Mathematics',
    keywords: ['linear equation', 'solve for x', '2x', 'equation'],
    answer:
      'Solving a linear equation is like **balancing a seesaw** ⚖️ — whatever you do to one side, do to the other.\n\nExample: `2x + 3 = 11`\n1. Subtract 3 from both sides → `2x = 8`\n2. Divide both sides by 2 → `x = 4`\n\nAlways check by substituting back: 2(4) + 3 = 11 ✓',
    deepDive:
      'The big idea is **inverse operations**: undo addition with subtraction, undo multiplication with division — always in reverse order of how the expression was built. That same idea powers every algebra topic that comes later.',
  },
  {
    id: 'factoring',
    subject: 'Mathematics',
    keywords: ['factor', 'factorise', 'factorize', 'difference of squares', 'quadratic'],
    answer:
      '**Factoring** means breaking an expression into pieces that multiply back together.\n\nThe superstar pattern is the **difference of squares**:\n`a² − b² = (a − b)(a + b)`\n\nSo `x² − 9 = (x − 3)(x + 3)` — because 9 is 3².',
    deepDive:
      'Why it matters: once a quadratic is factored, each bracket can be set to zero to find the solutions (roots). `x² − 9 = 0` → `x = 3` or `x = −3`. Factoring turns a hard question into two easy ones.',
  },
  {
    id: 'fractions',
    subject: 'Mathematics',
    keywords: ['fraction', 'numerator', 'denominator'],
    answer:
      '**Fractions** are just fair sharing. 🍕 The bottom (denominator) says how many equal slices; the top (numerator) says how many you have.\n\n- **Add/subtract:** make the denominators match first\n- **Multiply:** straight across, top×top and bottom×bottom\n- **Divide:** flip the second fraction and multiply',
    deepDive:
      'The "flip and multiply" rule works because dividing by a number is the same as multiplying by its reciprocal: dividing by ½ asks "how many halves fit?" — which doubles the answer. Try it with pizza slices and it clicks.',
  },
  {
    id: 'ph-acids',
    subject: 'Science',
    keywords: ['ph', 'acid', 'base', 'alkali', 'neutral solution'],
    answer:
      'The **pH scale** (0–14) measures how acidic or basic something is. 🧪\n\n- **0–6:** acidic (lemon juice ≈ 2)\n- **7:** neutral (pure water)\n- **8–14:** basic/alkaline (soap ≈ 10)\n\nLitmus trick: acids turn blue litmus **red**; bases turn red litmus **blue**.',
    deepDive:
      'Deeper: pH counts hydrogen ions (H⁺). Each step on the scale is a **10× change** — pH 3 is ten times more acidic than pH 4. That is why strong acid spills are serious even in small amounts.',
  },
  {
    id: 'cells',
    subject: 'Science',
    keywords: ['cell', 'mitochondria', 'nucleus', 'organelle'],
    answer:
      '**Cells** are the smallest units of life — every living thing is built from them. 🔬\n\n- **Nucleus:** the control centre (holds DNA)\n- **Mitochondria:** the powerhouse (makes energy)\n- **Cell membrane:** the security gate (controls what enters/exits)\n\nPlant cells add a **cell wall** and **chloroplasts**.',
    deepDive:
      'A useful next step is comparing plant vs animal cells in a two-column table — exams love that question. Plants have walls, chloroplasts, and one big vacuole; animal cells are squishier with many small vacuoles.',
  },
  {
    id: 'gravity',
    subject: 'Science',
    keywords: ['gravity', 'newton', 'falling', 'weight'],
    answer:
      '**Gravity** is the pull between objects with mass. 🌍\n\n- Earth pulls everything toward its centre at about **9.8 m/s²**\n- **Mass** (kg) never changes; **weight** (newtons) depends on gravity\n- On the Moon you would weigh ~1/6 as much — same mass though!',
    deepDive:
      "Newton's insight: the same force that drops an apple keeps the Moon orbiting. The Moon *is* falling toward Earth constantly — it just moves sideways fast enough to keep missing. That is what an orbit is.",
  },
  {
    id: 'tenses',
    subject: 'English',
    keywords: ['tense', 'grammar', 'past perfect', 'present continuous'],
    answer:
      '**Tenses** place actions in time. The big three:\n\n- **Past:** "She *went* to school"\n- **Present:** "She *goes* to school"\n- **Future:** "She *will go* to school"\n\nEach has simple/continuous/perfect forms — master simple forms first, they carry most exam marks.',
    deepDive:
      'The trap to watch: **third-person singular** in present simple adds -s ("she goes", not "she go"). For continuous forms, pair *am/is/are* with the -ing verb. Write three sentences about your day in each tense — fastest way to lock it in.',
  },
  {
    id: 'essay-writing',
    subject: 'English',
    keywords: ['essay', 'writing', 'paragraph', 'composition'],
    answer:
      'Strong essays follow a simple skeleton: 📝\n\n1. **Hook** — one interesting opening line\n2. **Point → Evidence → Explain** for each body paragraph\n3. **Conclusion** — restate your idea in fresh words\n\nShort sentences are your friend. One idea per paragraph.',
    deepDive:
      'Level up with **connectives** that signal structure: *however, therefore, for example, in contrast*. Examiners scan for them. And always save 3 minutes to reread — fixing five small errors can jump you a grade band.',
  },
  {
    id: 'exam-stress',
    subject: 'General',
    keywords: ['stress', 'anxious', 'anxiety', 'nervous', 'scared of exam', 'worried'],
    answer:
      'Feeling nervous before exams is completely normal — it means you care. 💙 Three things that genuinely help:\n\n1. **Breathe 4-4-4:** in for 4, hold 4, out 4 — calms your body fast\n2. **Small wins:** revise one small topic fully rather than everything at once\n3. **Sleep beats cramming** — memory forms while you sleep\n\nIf the worry feels heavy or constant, please talk to a parent, teacher, or counselor. You never have to handle it alone.',
    deepDive:
      'A practical trick: write worries on paper 10 minutes before an exam. Studies show "worry dumping" frees working memory for the actual questions. And remember — one exam never defines you.',
  },
  {
    id: 'revision',
    subject: 'General',
    keywords: ['revise', 'revision', 'memorize', 'remember', 'how to study', 'study tips'],
    answer:
      'The two most powerful study techniques (backed by research):\n\n1. **Active recall** 🧠 — close the book and *test yourself*. Struggling to remember is exactly what makes memory stick.\n2. **Spaced practice** 📅 — three 30-minute sessions across a week beat one 90-minute cram.\n\nRe-reading and highlighting *feel* productive but rank near the bottom. Test yourself instead!',
    deepDive:
      'Combine both with the **3-2-1 rhythm**: revisit new material after 3 days, then 2 weeks, then 1 month. Each successful recall roughly doubles how long the memory lasts. Flashcards are the easiest way to run this system.',
  },
  {
    id: 'percentages',
    subject: 'Mathematics',
    keywords: ['percent', 'percentage', '%'],
    answer:
      '**Percent** means "per hundred". 💯\n\n- 25% of 80 → `0.25 × 80 = 20`\n- Score as %: `(obtained ÷ maximum) × 100`\n- Increase by 10% → multiply by **1.10**; decrease by 10% → multiply by **0.90**',
    deepDive:
      'The trap: a 10% rise then a 10% fall does NOT return to the start — `×1.1×0.9 = ×0.99`, slightly less. Percentages always act on the *current* value, not the original.',
  },
];

const QUIZ_MARKER = /<!--quiz:([a-z0-9]+)-->/;
const TOPIC_MARKER = /<!--topic:([a-z-]+)-->/;

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

function formatQuiz(questionId: string): string {
  const question = questionBank.find((entry) => entry.id === questionId);
  if (!question) return 'Let me find another question for you — ask me to quiz you again!';
  const options = question.options
    .map((option, index) => `- **${OPTION_LETTERS[index]}.** ${option}`)
    .join('\n');
  return `Quiz time! 🎯 *(${question.subject} • ${question.topic} • ${question.difficulty})*\n\n**${question.prompt}**\n\n${options}\n\nReply with A, B, C, or D — I'll check your answer!<!--quiz:${question.id}-->`;
}

function pickQuizQuestion(text: string, subject: string, askedIds: string[]): string {
  const pool = questionBank.filter((question) => {
    const matchesTopic = question.topic.toLowerCase().split(' ').some((word) => text.includes(word));
    const matchesSubject =
      question.subject.toLowerCase().includes(subject.toLowerCase()) ||
      text.includes(question.subject.toLowerCase());
    return matchesTopic || matchesSubject;
  });
  const candidates = (pool.length ? pool : questionBank).filter(
    (question) => !askedIds.includes(question.id),
  );
  const chosen = candidates[0] ?? questionBank[0];
  return formatQuiz(chosen.id);
}

function gradeQuizAnswer(text: string, questionId: string): string | null {
  const question = questionBank.find((entry) => entry.id === questionId);
  if (!question) return null;

  const upper = text.trim().toUpperCase();
  let chosenIndex = OPTION_LETTERS.findIndex((letter) => upper === letter || upper.startsWith(`${letter}.`) || upper.startsWith(`${letter} `));
  if (chosenIndex === -1) {
    chosenIndex = question.options.findIndex((option) => text.includes(option.toLowerCase()));
  }
  if (chosenIndex === -1) return null;

  const correct = chosenIndex === question.answerIndex;
  const correctLabel = `**${OPTION_LETTERS[question.answerIndex]}. ${question.options[question.answerIndex]}**`;
  const verdict = correct
    ? `🎉 **Correct!** ${correctLabel} is right.`
    : `Almost! The answer is ${correctLabel} — good attempt though, wrong answers are where learning happens. 💪`;
  return `${verdict}\n\n*Why:* ${question.explanation}\n\nWant another one? Just say **quiz me**!`;
}

function progressSummary(context: MentorContext): string {
  if (!context.marks.length) {
    return 'I don\'t have marks saved for you yet — add them on the **Report Card** page and I\'ll give you a full breakdown! 📊';
  }
  const insight = analyzePerformance(context.marks);
  const name = context.studentName ? `${context.studentName}, you` : 'You';
  return `${name} are at **${insight.overall}%** overall. 📊\n\n- **Strongest:** ${insight.strongest.join(' and ')} — genuinely impressive\n- **Growth zone:** ${insight.improvement.join(' and ')} — small daily practice here moves your total fastest\n\n${context.attemptCount > 0 ? `You've completed **${context.attemptCount} mock test${context.attemptCount === 1 ? '' : 's'}** — every attempt teaches me more about how to help you. ` : ''}Want a quiz on your growth-zone subjects?`;
}

function personalTouch(entry: KnowledgeEntry, context: MentorContext): string {
  const isWeak = context.weakSubjects.some((subject) =>
    subject.toLowerCase().includes(entry.subject.toLowerCase()) ||
    entry.subject.toLowerCase().includes(subject.toLowerCase()),
  );
  if (isWeak) {
    return `\n\n✨ I noticed **${entry.subject}** is on your focus list — asking questions like this is exactly how it stops being tricky. Want a quick quiz on it?`;
  }
  return '\n\nWant to go deeper? Just ask **"why?"** — or say **"quiz me"** to test yourself!';
}

/** Main entry point: produce the mentor's next reply. */
export function adaptiveReply(
  messages: ChatMessage[],
  subject: string,
  context: MentorContext,
): string {
  const lastStudent = [...messages].reverse().find((message) => message.role === 'student');
  const text = (lastStudent?.content ?? '').toLowerCase();
  const mentorHistory = messages.filter((message) => message.role === 'mentor');
  const lastMentor = mentorHistory.at(-1);

  // 1. Grading: the previous mentor message was a quiz and the student answered.
  const quizMatch = lastMentor?.content.match(QUIZ_MARKER);
  if (quizMatch) {
    const graded = gradeQuizAnswer(text, quizMatch[1]);
    if (graded) return graded;
  }

  // 2. New quiz request.
  if (text.includes('quiz') || text.includes('test me') || text.includes('question me')) {
    const askedIds = mentorHistory
      .map((message) => message.content.match(QUIZ_MARKER)?.[1])
      .filter((id): id is string => Boolean(id));
    return pickQuizQuestion(text, subject, askedIds);
  }

  // 3. Progress questions — answered from the student's real data.
  if (
    text.includes('how am i doing') ||
    text.includes('my marks') ||
    text.includes('my progress') ||
    text.includes('my score') ||
    text.includes('marks falling') ||
    text.includes('doing well')
  ) {
    return progressSummary(context);
  }

  // 4. Follow-up ("why?", "explain more") on the last knowledge topic.
  if (/^(why|how come|explain more|tell me more|go deeper|more\??)\??$/.test(text.trim()) || text.includes('explain more') || text.includes('tell me more')) {
    const topicId = [...mentorHistory]
      .reverse()
      .map((message) => message.content.match(TOPIC_MARKER)?.[1])
      .find(Boolean);
    const entry = KNOWLEDGE_BASE.find((candidate) => candidate.id === topicId);
    if (entry) return `${entry.deepDive}\n\nStill curious? Keep the "why"s coming — that's what great learners do! 🚀<!--topic:${entry.id}-->`;
  }

  // 5. Knowledge base lookup.
  const entry = KNOWLEDGE_BASE.find((candidate) =>
    candidate.keywords.some((keyword) => text.includes(keyword)),
  );
  if (entry) {
    return `${entry.answer}${personalTouch(entry, context)}<!--topic:${entry.id}-->`;
  }

  // 6. Greetings.
  if (/^(hi|hii+|hello|hey|namaste|good (morning|afternoon|evening))\b/.test(text.trim())) {
    const name = context.studentName ? `, ${context.studentName}` : '';
    return `Hey${name}! 👋 I'm **Mo**, your study mentor. I can:\n\n- **Explain** topics — try "explain photosynthesis"\n- **Quiz you** — say "quiz me on algebra"\n- **Track progress** — ask "how am I doing?"\n- **Plan study** — ask about revision techniques\n\nWhat should we explore?`;
  }

  if (text.includes('thank')) {
    return `You're so welcome! 💙 Every question you ask makes me better at helping you${context.studentName ? `, ${context.studentName}` : ''}. Come back anytime!`;
  }

  if (text.includes('career')) {
    const strong = context.strongSubjects[0];
    return `Careers are exciting to explore! ${strong ? `You're strong in **${strong}** — that opens doors in many directions. ` : ''}Check the **Career** page for clusters matched to your marks and interests.\n\nRemember: these are ideas for exploration, not final answers — talk them through with parents, teachers, or a counselor. 🧭`;
  }

  // 7. Default: a structured, personalized study nudge.
  const focus = context.weakSubjects[0] ?? subject;
  return `Great question! Here's how I'd tackle **${subject}** today:\n\n1. **Pick one small topic** — narrow beats broad\n2. **Learn it actively** — explain it out loud in your own words\n3. **Test yourself** — say "quiz me" and I'll fire a question\n4. **Log mistakes kindly** — they're data, not failures\n\n${focus !== subject ? `💡 Tip: your focus list says **${focus}** could use some love — want to switch to that?` : 'What topic should we break down together?'}`;
}

/** Strips internal state markers for contexts that need clean text (e.g. LLM history). */
export function stripMarkers(content: string): string {
  return content.replace(QUIZ_MARKER, '').replace(TOPIC_MARKER, '');
}
