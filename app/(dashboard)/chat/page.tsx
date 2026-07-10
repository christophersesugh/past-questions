"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Plus,
  Bot,
  User,
  Sparkles,
  Paperclip,
  BookOpen,
  ArrowUpRight,
  Brain,
  ChevronRight,
  Database,
  ExternalLink,
  Info
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  timestamp: string;
  sources?: Array<{
    paper: string;
    question: string;
    similarity: string;
  }>;
}

interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

const mockSessions: ChatSession[] = [
  {
    id: "session-1",
    title: "Operating Systems Semaphores",
    date: "Today",
    messages: [
      {
        id: "msg-1-1",
        role: "USER",
        content: "What is a semaphore and how does it solve process synchronization issues?",
        timestamp: "4:15 PM",
      },
      {
        id: "msg-1-2",
        role: "ASSISTANT",
        content: `A **semaphore** is an integer variable used for signaling and solving the process synchronization problem. It is accessed only through two standard atomic operations: \`wait()\` (historically known as \`P\`) and \`signal()\` (historically known as \`V\`).

### 1. Types of Semaphores
* **Binary Semaphore**: Can only take values \`0\` and \`1\`. It behaves similarly to a mutex lock, providing mutual exclusion.
* **Counting Semaphore**: Can take values over an unrestricted domain. It is useful for controlling access to a finite set of resources.

### 2. Implementation Mechanics
The classic implementation of the synchronization operations:
\`\`\`cpp
void wait(Semaphore S) {
    while (S <= 0) {
        // busy wait (or block process in list)
    }
    S--;
}

void signal(Semaphore S) {
    S++;
}
\`\`\`

When a process executes \`wait()\`, it is blocked if the semaphore is less than or equal to zero. When a process finishes with a resource, it executes \`signal()\`, waking up any blocked processes.`,
        timestamp: "4:16 PM",
        sources: [
          {
            paper: "COSC 301 - Operating Systems 2024.pdf",
            question: "Define mutual exclusion and discuss how semaphores can be used to solve synchronization issues.",
            similarity: "94%",
          },
          {
            paper: "COSC 301 - Operating Systems 2024.pdf",
            question: "What is the critical section problem? Detail the three requirements that must be met by any valid solution.",
            similarity: "81%",
          },
        ],
      },
    ],
  },
  {
    id: "session-2",
    title: "Database Relational Keys",
    date: "Yesterday",
    messages: [
      {
        id: "msg-2-1",
        role: "USER",
        content: "How do I identify functional dependencies and candidate keys?",
        timestamp: "11:30 AM",
      },
      {
        id: "msg-2-2",
        role: "ASSISTANT",
        content: "Functional dependencies represent constraints between sets of attributes in a relation. To find candidate keys: \n\n1. Find the closure of all individual attributes (or attribute groups) using Armstrong's axioms.\n2. An attribute set is a key if its closure contains all attributes in the relation.\n3. It is a candidate key if it is superkey and minimal (no proper subset is also a superkey).",
        timestamp: "11:31 AM",
        sources: [
          {
            paper: "COSC 303 - Database Systems 2025.docx",
            question: "Given a schema R(A, B, C, D, E) with functional dependencies F = {A -> BC, CD -> E, B -> D}, identify the candidate keys and determine the highest normal form of R.",
            similarity: "92%",
          },
        ],
      },
    ],
  },
];

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(mockSessions);
  const [activeSessionId, setActiveSessionId] = useState("session-1");
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSourceMessage, setSelectedSourceMessage] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    scrollToBottom();
  }, [activeSession.messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "USER",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Append user message immediately
    const updatedSessions = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: [...s.messages, userMsg],
        };
      }
      return s;
    });
    setSessions(updatedSessions);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI response stream
    setTimeout(() => {
      setIsTyping(false);
      const aiResponseContent = `Based on your uploaded documents, process execution parameters require strict bounds on shared memory structures. 

Here is the code representation of process exclusion:
\`\`\`cpp
do {
    acquire_lock();
    // Critical Section
    release_lock();
    // Remainder Section
} while (true);
\`\`\`

To resolve synchronization:
1. Ensure mutual exclusion is preserved.
2. Ensure progressive access without deadlocks.
3. Keep bounds on waiting times to avoid starvation.`;

      const aiMsg: Message = {
        id: `msg-ai-${Date.now()}`,
        role: "ASSISTANT",
        content: aiResponseContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: [
          {
            paper: "COSC 301 - Operating Systems 2024.pdf",
            question: "What is the critical section problem? Detail the three requirements that must be met by any valid solution.",
            similarity: "91%",
          },
        ],
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: [...s.messages, aiMsg],
            };
          }
          return s;
        })
      );
    }, 2000);
  };

  const handleNewSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "New Chat Session",
      date: "Today",
      messages: [
        {
          id: `msg-welcome-${Date.now()}`,
          role: "ASSISTANT",
          content: "Hello! Ask me any question related to your uploaded past papers, and I will answer with direct reference to the exam questions.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex gap-6 relative overflow-hidden animate-fade-in">
      {/* Sessions Sidebar */}
      <div className="w-64 bg-white/70 dark:bg-zinc-950/70 border border-slate-200/50 dark:border-zinc-800/50 rounded-3xl p-4 flex flex-col backdrop-blur-md hidden md:flex shrink-0">
        <Button
          onClick={handleNewSession}
          className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium gap-2 shadow-md shadow-violet-500/10 mb-4"
        >
          <Plus className="h-4 w-4" />
          New Thread
        </Button>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-2 mb-2">
            Active Threads
          </div>
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <button
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all truncate border",
                  isActive
                    ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 dark:border-violet-500/10"
                    : "text-slate-600 dark:text-zinc-400 border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900/40"
                )}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1">{session.title}</span>
                <ChevronRight className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white/70 dark:bg-zinc-950/70 border border-slate-200/50 dark:border-zinc-800/50 rounded-3xl overflow-hidden backdrop-blur-md relative">
        {/* Chat Title bar */}
        <div className="h-14 border-b border-slate-100 dark:border-zinc-800/50 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {activeSession.title}
              </span>
              <span className="text-[9px] text-emerald-500 font-semibold flex items-center gap-1">
                ● RAG Engine Grounded
              </span>
            </div>
          </div>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeSession.messages.map((message) => {
            const isUser = message.role === "USER";
            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4 max-w-3xl",
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm text-xs font-bold",
                    isUser
                      ? "bg-teal-500/10 text-teal-600 dark:text-teal-400"
                      : "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                  )}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div className="space-y-2">
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl text-xs leading-relaxed border font-sans whitespace-pre-wrap shadow-sm",
                      isUser
                        ? "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800/60 text-slate-800 dark:text-zinc-200 rounded-tr-none"
                        : "bg-white dark:bg-zinc-950 border-slate-200/50 dark:border-zinc-900 text-slate-800 dark:text-zinc-200 rounded-tl-none"
                    )}
                  >
                    {message.content}
                  </div>

                  {/* Sources Grounding Tag */}
                  {!isUser && message.sources && message.sources.length > 0 && (
                    <div className="flex items-center gap-1.5 pl-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSourceMessage(message)}
                        className="h-6 px-2 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50 text-[10px] text-violet-600 hover:text-violet-700 dark:text-violet-400 flex items-center gap-1 font-semibold"
                      >
                        <Database className="h-3 w-3" />
                        Grounded on {message.sources.length} past paper references
                        <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <span className="block text-[9px] text-slate-400 dark:text-zinc-500 pl-1">
                    {message.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-4 mr-auto max-w-3xl">
              <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 text-violet-600 dark:text-violet-400">
                <Bot className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <div className="bg-white dark:bg-zinc-950 border border-slate-200/50 dark:border-zinc-900 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1 h-10 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-violet-600 dark:bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-violet-600 dark:bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-violet-600 dark:bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Text Input Panel */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-slate-100 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-950/30 flex gap-2 items-end relative"
        >
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-10 w-10 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-full shrink-0"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Ask a question about semaphores, normal forms..."
            className="flex-1 min-h-[44px] max-h-32 h-[44px] py-3 rounded-2xl border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 outline-none focus-visible:ring-1 focus-visible:ring-violet-500 text-xs resize-none"
          />

          <Button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="h-10 w-10 rounded-full bg-violet-600 hover:bg-violet-700 text-white shrink-0 shadow-md shadow-violet-500/10 flex items-center justify-center"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* RAG Context Panel Side Drawer */}
      {selectedSourceMessage && (
        <div className="absolute inset-y-0 right-0 w-80 bg-white dark:bg-zinc-950 border-l border-slate-200 dark:border-zinc-800/80 p-5 z-40 flex flex-col shadow-2xl animate-slide-in backdrop-blur-md rounded-l-3xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Database className="h-4.5 w-4.5 text-violet-500" />
              RAG Retrieval Context
            </h3>
            <button
              onClick={() => setSelectedSourceMessage(null)}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
            >
              Close
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-relaxed flex items-center gap-1 mb-4">
            <Info className="h-3 w-3 shrink-0" />
            The AI response was generated using these parsed exam questions retrieved from your document library:
          </p>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {selectedSourceMessage.sources?.map((src, i) => (
              <div
                key={i}
                className="p-4 border border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/20 rounded-2xl space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">
                    Match: {src.similarity}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {src.paper.split(" - ")[0]}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-700 dark:text-zinc-300 leading-relaxed italic font-mono">
                  &ldquo;{src.question}&rdquo;
                </p>
                <div className="flex justify-end pt-1">
                  <a
                    href="#"
                    className="text-[9px] font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-0.5 hover:underline"
                  >
                    View Source Document
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
