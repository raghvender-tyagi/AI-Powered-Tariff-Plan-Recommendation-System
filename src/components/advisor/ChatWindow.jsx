import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, Bot, User, Wand2 } from 'lucide-react';
import { Card, Button, ProgressBar, Badge } from '@/components/ui/Primitives';
import { PlanCard } from '@/components/recommendations/PlanCard';
import { startChat, sendChatMessage } from '@/api/chat';
import { useAppStore } from '@/store/useAppStore';

const SUGGESTED = [
  'I stream a lot of video and rarely call',
  'I need a plan under ₹500 with good calling minutes',
  'I travel internationally every couple of months',
  'What plan works best for a family of four?',
];

const REQUIRED_FIELDS = ['dataNeed', 'callingNeed', 'budget', 'roamingRequired', 'familyOrIndividual'];

export function ChatWindow({ compact = false, className = '' }) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [partialProfile, setPartialProfile] = useState({});
  const [plans, setPlans] = useState(null);
  const [starting, setStarting] = useState(true);
  const listRef = useRef(null);
  const customerId = useAppStore((s) => s.customerId);
  const setLastRecommendations = useAppStore((s) => s.setLastRecommendations);

  useEffect(() => {
    let mounted = true;
    startChat(customerId).then(({ data }) => {
      if (!mounted) return;
      setSessionId(data.sessionId);
      setMessages([{ role: 'assistant', content: data.reply, id: 'greeting' }]);
      setStarting(false);
    });
    return () => {
      mounted = false;
    };
  }, [customerId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setMessages((m) => [...m, { role: 'user', content: trimmed, id: `u_${Date.now()}` }]);
    setInput('');
    setTyping(true);
    try {
      const { data } = await sendChatMessage(sessionId, trimmed, partialProfile);
      if (data.profile) setPartialProfile((p) => ({ ...p, ...data.profile }));
      setMessages((m) => [...m, { role: 'assistant', content: data.reply, id: `a_${Date.now()}`, plans: data.plans }]);
      if (data.plans) {
        setPlans(data.plans);
        setLastRecommendations(data.plans);
      }
    } finally {
      setTyping(false);
    }
  };

  const completedCount = REQUIRED_FIELDS.filter((f) => partialProfile[f] !== undefined).length;
  const progressPct = plans ? 100 : (completedCount / REQUIRED_FIELDS.length) * 100;

  return (
    <Card className={`flex flex-col overflow-hidden ${compact ? 'h-[520px]' : 'h-[70vh] min-h-[520px]'} ${className}`}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-base-700 bg-base-900/60">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-green-400 flex items-center justify-center shrink-0">
          <Bot className="h-4.5 w-4.5 text-base-950" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-base-50">AI Tariff Advisor</p>
          <p className="text-xs text-base-400">{typing ? 'Typing…' : 'Online · usually replies instantly'}</p>
        </div>
        <Badge tone={plans ? 'green' : 'cyan'}>{plans ? 'Profile complete' : `${Math.round(progressPct)}% profile`}</Badge>
      </div>
      <div className="px-5 pt-3">
        <ProgressBar value={progressPct} tone={plans ? 'green' : 'cyan'} height="h-1.5" />
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-4">
        {starting && <TypingBubble />}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {typing && <TypingBubble />}
      </div>

      {!plans && (
        <div className="px-5 pb-2 flex gap-2 overflow-x-auto scrollbar-thin">
          {SUGGESTED.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="whitespace-nowrap rounded-full border border-base-700 bg-base-800/60 px-3 py-1.5 text-xs text-base-300 hover:border-cyan-400/50 hover:text-cyan-300 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 px-5 py-4 border-t border-base-700"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell me about your usage…"
          aria-label="Message the AI advisor"
          disabled={starting}
          className="flex-1 rounded-xl bg-base-800/70 border border-base-700 px-4 py-2.5 text-sm text-base-100 placeholder:text-base-500 outline-none focus-visible:border-cyan-400/60"
        />
        <Button type="submit" size="md" icon={Send} disabled={!input.trim() || typing || starting} aria-label="Send message">
          Send
        </Button>
      </form>
    </Card>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <span
        className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-base-700 text-base-200' : 'bg-gradient-to-br from-cyan-400 to-green-400 text-base-950'
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      </span>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-3`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser ? 'bg-cyan-400 text-base-950 rounded-tr-sm' : 'bg-base-800 text-base-100 rounded-tl-sm'
          }`}
        >
          {message.content}
        </div>
        {message.plans && (
          <div className="grid gap-3 w-full">
            {message.plans.map((entry) => (
              <PlanCard key={entry.planId} entry={entry} featured={entry.rank === 1} className="max-w-sm" />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-2.5">
      <span className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-400 to-green-400 flex items-center justify-center shrink-0">
        <Wand2 className="h-3.5 w-3.5 text-base-950" />
      </span>
      <div className="bg-base-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-base-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
