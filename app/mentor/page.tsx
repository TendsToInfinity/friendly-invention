'use client';

import { useState } from 'react';
import { marked } from 'marked';
import { PageLoading } from '@/components/loading';
import { Button, Card, Shell } from '@/components/ui';
import { useChatHistory } from '@/hooks/useDemoData';
import { MockAIProvider } from '@/services/ai';
import { repo } from '@/services/storage';
import { uid } from '@/lib/utils';
import type { ChatMessage } from '@/types/models';

const prompts = ['Help me understand photosynthesis.', 'Why are my mathematics marks falling?', 'Create a study plan for my science exam.', 'Which careers use mathematics?', 'Quiz me on algebra.'];

export default function Mentor() {
  const { hydrated, messages, setMessages } = useChatHistory();
  const [input, setInput] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [typing, setTyping] = useState(false);
  if (!hydrated) return <PageLoading label="Opening mentor chat…" />;

  async function send(text = input) {
    if (!text.trim()) return;
    const nextMessages: ChatMessage[] = [...messages, { id: uid(), role: 'student', content: text, createdAt: new Date().toISOString(), subject }];
    setMessages(nextMessages);
    setInput('');
    setTyping(true);
    const reply = await new MockAIProvider().reply(nextMessages, subject);
    const completed: ChatMessage[] = [...nextMessages, { id: uid(), role: 'mentor', content: reply, createdAt: new Date().toISOString(), subject }];
    setMessages(completed);
    repo.saveChat(completed);
    setTyping(false);
  }

  return (
    <Shell>
      <main className="mx-auto max-w-4xl p-4">
        <Card>
          <div className="flex justify-between gap-3">
            <h1 className="text-3xl font-bold">AI Mentor Chat</h1>
            <Button variant="ghost" onClick={() => { repo.saveChat([]); setMessages([]); }}>Clear chat</Button>
          </div>
          <select aria-label="Subject" className="my-3 rounded-xl border p-2" value={subject} onChange={(event) => setSubject(event.target.value)}>
            {['Mathematics', 'Science', 'English', 'General'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <div className="h-[55vh] overflow-auto rounded-2xl bg-slate-50 p-4">
            {messages.map((message) => (
              <div key={message.id} className={`my-3 max-w-[85%] rounded-2xl p-3 ${message.role === 'mentor' ? 'bg-white' : 'ml-auto bg-blue-600 text-white'}`}>
                <b>{message.role === 'mentor' ? 'Mentor' : 'You'}</b>
                <div dangerouslySetInnerHTML={{ __html: marked.parse(message.content) as string }} />
              </div>
            ))}
            {typing && <p>Mentor is typing...</p>}
          </div>
          <div className="my-3 flex flex-wrap gap-2">
            {prompts.map((prompt) => <Button key={prompt} variant="ghost" onClick={() => send(prompt)}>{prompt}</Button>)}
          </div>
          <div className="flex gap-2">
            <input aria-label="Message" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void send(); }} className="flex-1 rounded-xl border p-3" />
            <Button onClick={() => void send()}>Send</Button>
          </div>
        </Card>
      </main>
    </Shell>
  );
}
