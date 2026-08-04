"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Plus,
  Bot,
  User,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  ChevronRight,
  Database,
  ExternalLink,
  Info,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  updatedAt: string;
  messageCount: number;
  messages: Message[];
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSourceMessage, setSelectedSourceMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/chat/sessions");
      const data = await res.json();
      if (res.ok) {
        const sessList = data.sessions || [];
        // Fetch messages for each session (lazy load only active)
        if (sessList.length > 0 && !activeSessionId) {
          const firstId = sessList[0].id;
          setActiveSessionId(firstId);
          // Load messages for first session
          const firstFull = await fetchSessionMessages(firstId);
          setSessions(sessList.map((s: any) => s.id === firstId ? firstFull : { ...s, messages: [] }));
        } else {
          setSessions(sessList.map((s: any) => ({ ...s, messages: s.messages || [] })));
        }
      }
    } catch (e) {
      setError("Failed to load chat sessions");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionMessages = async (sessionId: string): Promise<ChatSession> => {
    const res = await fetch(`/api/chat/messages?sessionId=${sessionId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load messages");
    
    // Find existing session meta
    const meta = sessions.find(s => s.id === sessionId);
    
    return {
      id: sessionId,
      title: data.session?.title || meta?.title || "Chat Session",
      date: meta?.date || new Date().toLocaleDateString(),
      updatedAt: new Date().toISOString(),
      messageCount: data.messages?.length || 0,
      messages: (data.messages || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        sources: m.sources,
      })),
    };
  };

  const handleSelectSession = async (sessionId: string) => {
    const existing = sessions.find(s => s.id === sessionId);
    if (existing && existing.messages.length > 0) {
      setActiveSessionId(sessionId);
      return;
    }
    try {
      const full = await fetchSessionMessages(sessionId);
      setSessions(prev => prev.map(s => s.id === sessionId ? full : s));
      setActiveSessionId(sessionId);
    } catch (e) {
      setError("Failed to load messages");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "USER",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const messageToSend = inputMessage;
    setInputMessage("");
    setIsTyping(true);

    // Optimistic update
    if (activeSessionId) {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));
    } else {
      // No active session, will be created by API
      const tempId = `temp-${Date.now()}`;
      setSessions(prev => [{
        id: tempId,
        title: messageToSend.slice(0, 32),
        date: "Just now",
        updatedAt: new Date().toISOString(),
        messageCount: 1,
        messages: [userMsg],
      }, ...prev]);
      setActiveSessionId(tempId);
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
          sessionId: activeSessionId?.startsWith("temp-") ? undefined : activeSessionId,
        }),
      });

      // Check if it's JSON fallback (no OPENAI key) or streaming
      const contentType = res.headers.get("content-type");
      
      if (contentType?.includes("application/json")) {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Chat failed");

        const aiMsg: Message = {
          id: `msg-ai-${Date.now()}`,
          role: "ASSISTANT",
          content: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sources: data.sources,
        };

        if (activeSessionId?.startsWith("temp-") || !activeSessionId) {
          // Replace temp session with real one
          const realSessionId = data.sessionId;
          setSessions(prev => {
            const withoutTemp = prev.filter(s => !s.id.startsWith("temp-"));
            return [{
              id: realSessionId,
              title: messageToSend.slice(0, 32),
              date: "Just now",
              updatedAt: new Date().toISOString(),
              messageCount: 2,
              messages: [userMsg, aiMsg],
            }, ...withoutTemp];
          });
          setActiveSessionId(data.sessionId);
        } else {
          setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
              const sourcesHeader = res.headers.get("x-sources");
              return { ...s, messages: [...s.messages, aiMsg] };
            }
            return s;
          }));
        }
      } else {
        // Streaming response
        const sessionIdHeader = res.headers.get("x-session-id");
        const sourcesHeader = res.headers.get("x-sources");
        let parsedSources: any[] = [];
        try {
          parsedSources = sourcesHeader ? JSON.parse(decodeURIComponent(sourcesHeader)) : [];
        } catch {
          try {
            parsedSources = sourcesHeader ? JSON.parse(sourcesHeader) : [];
          } catch {}
        }

        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        const aiMsgId = `msg-ai-${Date.now()}`;
        
        // Create placeholder AI message
        const createPlaceholder = () => {
          setSessions(prev => prev.map(s => {
            if (s.id === (sessionIdHeader || activeSessionId)) {
              const exists = s.messages.find(m => m.id === aiMsgId);
              if (exists) {
                return { ...s, messages: s.messages.map(m => m.id === aiMsgId ? { ...m, content: fullText } : m) };
              } else {
                return { 
                  ...s, 
                  messages: [...s.messages, {
                    id: aiMsgId,
                    role: "ASSISTANT" as const,
                    content: fullText,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    sources: parsedSources,
                  }]
                };
              }
            }
            return s;
          }));
        };

        if (activeSessionId?.startsWith("temp-")) {
          const realId = sessionIdHeader;
          if (realId) {
            setSessions(prev => {
              const tempSession = prev.find(s => s.id === activeSessionId);
              const withoutTemp = prev.filter(s => !s.id.startsWith("temp-"));
              if (!tempSession) return prev;
              return [{
                id: realId,
                title: tempSession.title,
                date: tempSession.date,
                updatedAt: new Date().toISOString(),
                messageCount: tempSession.messages.length + 1,
                messages: [...tempSession.messages, {
                  id: aiMsgId,
                  role: "ASSISTANT" as const,
                  content: "",
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  sources: parsedSources,
                }],
              }, ...withoutTemp];
            });
            setActiveSessionId(realId);
          }
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          createPlaceholder();
        }

        // Ensure final sessionId update if needed
        if (sessionIdHeader && activeSessionId?.startsWith("temp-")) {
          setActiveSessionId(sessionIdHeader);
        } else if (sessionIdHeader && !activeSessionId) {
          setActiveSessionId(sessionIdHeader);
          await fetchSessions(); // Refresh list
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to send message");
      // Remove optimistic user message on error
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.slice(0, -1) } : s));
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewSession = () => {
    setActiveSessionId(null);
    setSelectedSourceMessage(null);
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this chat session?")) return;
    try {
      const res = await fetch(`/api/chat/sessions?sessionId=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (activeSessionId === id) {
          setActiveSessionId(sessions.length > 1 ? sessions.find(s => s.id !== id)?.id || null : null);
        }
      }
    } catch {}
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
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl bg-slate-100 dark:bg-zinc-900 animate-pulse" />)}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-zinc-500 px-2">No chat sessions yet. Start a new thread.</p>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div key={session.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => handleSelectSession(session.id)}
                    className={cn(
                      "flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all truncate border",
                      isActive
                        ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 dark:border-violet-500/10"
                        : "text-slate-600 dark:text-zinc-400 border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900/40"
                    )}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="truncate flex-1">{session.title}</span>
                    <ChevronRight className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                  </button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500" onClick={(e) => handleDeleteSession(session.id, e)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/50 mt-3 text-[10px] text-slate-400 dark:text-zinc-500">
          {error && <span className="text-red-500">{error}</span>}
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
                {activeSession ? activeSession.title : "New Chat Session"}
              </span>
              <span className="text-[9px] text-emerald-500 font-semibold flex items-center gap-1">
                ● RAG Engine Grounded
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="md:hidden" onClick={handleNewSession}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
              <div className="h-16 w-16 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500">
                <Sparkles className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-zinc-100">StudyAI Tutor Ready</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs">
                  Ask me any question related to your uploaded past papers, and I will answer with direct reference to the exam questions. Upload papers first for best results.
                </p>
              </div>
            </div>
          ) : (
            activeSession.messages.map((message) => {
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
            })
          )}

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

        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-slate-100 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-950/30 flex gap-2 items-end relative"
        >
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Ask a question about your past papers..."
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
