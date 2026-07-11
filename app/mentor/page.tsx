'use client';

import { useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { PageLoading } from '@/components/loading';
import { Button, Card, Shell } from '@/components/ui';
import { useChatHistory } from '@/hooks/useDemoData';
import { uid } from '@/lib/utils';
import { aiProvider } from '@/services/ai';
import { repo } from '@/services/storage';
import type { ChatMessage } from '@/types/models';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'General'];

const SUGGESTED_PROMPTS = [
  'Help me understand photosynthesis.',
  'Why are my mathematics marks falling?',
  'Create a study plan for my science exam.',
  'Which careers use mathematics?',
  'Quiz me on algebra.',
];

/** Renders markdown chat content, sanitized to prevent XSS from message text. */
function MessageBody({ content }: { content: string }) {
  const html = useMemo(
    () => DOMPurify.sanitize(marked.parse(content, { async: false })),
    [content],
  );
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function Mentor() {
  const { hydrated, messages, setMessages } = useChatHistory();
  const [input, setInput] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [typing, setTyping] = useState(false);

  if (!hydrated) return <PageLoading label="Opening mentor chat…" />;

  async function send(text = input) {
    if (!text.trim() || typing) return;

    const studentMessage: ChatMessage = {
      id: uid(),
      role: 'student',
      content: text,
      createdAt: new Date().toISOString(),
      subject,
    };
    const nextMessages = [...messages, studentMessage];
    setMessages(nextMessages);
    setInput('');
    setTyping(true);

    try {
      const reply = await aiProvider.reply(nextMessages, subject);
      const mentorMessage: ChatMessage = {
        id: uid(),
        role: 'mentor',
        content: reply,
        createdAt: new Date().toISOString(),
        subject,
      };
      const completed = [...nextMessages, mentorMessage];
      setMessages(completed);
      repo.saveChat(completed);
    } finally {
      setTyping(false);
    }
  }

  function clearChat() {
    repo.saveChat([]);
    setMessages([]);
  }

  return (
    <Shell>
      <main className="mx-auto max-w-4xl p-4">
        <Card>
          <div className="flex justify-between gap-3">
            <h1 className="text-3xl font-bold">AI Mentor Chat</h1>
            <Button variant="ghost" onClick={clearChat}>Clear chat</Button>
          </div>
          <select
            aria-label="Subject"
            className="my-3 rounded-xl border p-2"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          >
            {SUBJECTS.map((item) => <option key={item}>{item}</option>)}
          </select>
          <div className="h-[55vh] overflow-auto rounded-2xl bg-slate-50 p-4" aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`my-3 max-w-[85%] rounded-2xl p-3 ${message.role === 'mentor' ? 'bg-white' : 'ml-auto bg-blue-600 text-white'}`}
              >
                <b>{message.role === 'mentor' ? 'Mentor' : 'You'}</b>
                <MessageBody content={message.content} />
              </div>
            ))}
            {typing && <p>Mentor is typing...</p>}
          </div>
          <div className="my-3 flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <Button key={prompt} variant="ghost" disabled={typing} onClick={() => void send(prompt)}>
                {prompt}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              aria-label="Message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void send();
              }}
              className="flex-1 rounded-xl border p-3"
            />
            <Button disabled={typing} onClick={() => void send()}>Send</Button>
          </div>
        </Card>
      </main>
    </Shell>
  );
}
