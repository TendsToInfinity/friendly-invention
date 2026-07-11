'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { PageLoading } from '@/components/loading';
import { Mascot } from '@/components/mascot';
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
  'Quiz me on algebra. 🎯',
  'How do I revise better?',
  'Which careers use mathematics?',
];

/** Renders markdown chat content, sanitized to prevent XSS from message text. */
function MessageBody({ content }: { content: string }) {
  const html = useMemo(
    () => DOMPurify.sanitize(marked.parse(content, { async: false })),
    [content],
  );
  return <div className="prose-chat" dangerouslySetInnerHTML={{ __html: html }} />;
}

function TypingIndicator() {
  return (
    <div className="my-3 flex items-center gap-2">
      <Mascot size={32} />
      <span className="flex gap-1 rounded-2xl bg-white p-3" aria-label="Mentor is typing">
        <span className="typing-dot h-2 w-2 rounded-full bg-blue-500" />
        <span className="typing-dot h-2 w-2 rounded-full bg-violet" />
        <span className="typing-dot h-2 w-2 rounded-full bg-teal" />
      </span>
    </div>
  );
}

export default function Mentor() {
  const { hydrated, messages, setMessages } = useChatHistory();
  const [input, setInput] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

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
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Mascot size={48} className="animate-float" />
              <div>
                <h1 className="text-3xl font-bold">AI Mentor Chat</h1>
                <p className="text-sm text-slate-500">Ask me anything — I learn from your progress! ✨</p>
              </div>
            </div>
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
          <div
            ref={scrollRef}
            className="h-[55vh] overflow-auto rounded-2xl bg-gradient-to-b from-slate-50 to-blue-50/50 p-4"
            aria-live="polite"
          >
            {messages.map((message) => (
              <div key={message.id} className={`animate-pop my-3 flex items-end gap-2 ${message.role === 'mentor' ? '' : 'flex-row-reverse'}`}>
                {message.role === 'mentor' && <Mascot size={32} />}
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                    message.role === 'mentor'
                      ? 'rounded-bl-sm bg-white'
                      : 'rounded-br-sm bg-gradient-to-r from-blue-600 to-violet text-white'
                  }`}
                >
                  <b>{message.role === 'mentor' ? 'Mo' : 'You'}</b>
                  <MessageBody content={message.content} />
                </div>
              </div>
            ))}
            {typing && <TypingIndicator />}
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
              placeholder="Ask me anything…"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void send();
              }}
              className="focus-ring flex-1 rounded-xl border p-3"
            />
            <Button disabled={typing} onClick={() => void send()}>Send</Button>
          </div>
        </Card>
      </main>
    </Shell>
  );
}
