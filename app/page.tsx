"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  TrendingUp,
  Brain,
  MessageSquare,
  UploadCloud,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-800 dark:text-zinc-100 flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Background glow blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-violet-600/10 dark:bg-violet-600/5 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-[120px]" />
      </div>

      {/* Navigation Header */}
      <header className="h-20 border-b border-slate-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6 lg:px-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
            <BookOpen className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-transparent tracking-tight">
            StudyAI
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-slate-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            Dashboard
          </Link>
          <Button asChild className="rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 hover:from-violet-700 hover:to-teal-600 text-white font-semibold shadow-md shadow-violet-500/15">
            <Link href="/auth/login">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-16 py-16 md:py-24 space-y-24 z-10">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold border border-violet-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Personalized Revision
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-slate-900 dark:text-zinc-50">
            Turn Static Past Papers Into{" "}
            <span className="bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-transparent">
              Active Dialogue
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto font-medium">
            Upload course past questions and let our AI extract exam topics, generate interactive 3D flashcards, construct practice tests, and guide you through revision sessions with RAG grounding.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Button asChild size="lg" className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 shadow-lg shadow-violet-500/20">
              <Link href="/dashboard">
                Enter Study Portal
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-semibold px-8">
              <Link href="/auth/register">
                Register Account
              </Link>
            </Button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-zinc-50">
              Assisted Learning Pipeline
            </h2>
            <p className="text-xs md:text-sm text-slate-400 dark:text-zinc-500 max-w-lg mx-auto">
              Unlock a structured workflow designed to maximize retention and identify curriculum trends.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-4">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl border border-slate-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md space-y-4 hover:border-violet-500/30 dark:hover:border-violet-500/20 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <UploadCloud className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-sm group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                Ingestion & OCR
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-sans">
                Drag-and-drop course PDFs. The system extracts questions, parses formatting, and identifies exam categories.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl border border-slate-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md space-y-4 hover:border-violet-500/30 dark:hover:border-violet-500/20 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-sm group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                RAG AI Tutor
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-sans">
                Consult a chatbot grounded in uploaded papers. Answers reference exact questions retrieved from past tests.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl border border-slate-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md space-y-4 hover:border-violet-500/30 dark:hover:border-violet-500/20 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Brain className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-sm group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                3D Recall Cards
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-sans">
                Active recall study sessions. Self-assess with flashcards generated by AI from extracted questions.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl border border-slate-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md space-y-4 hover:border-violet-500/30 dark:hover:border-violet-500/20 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-sm group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                Exam Analytics
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-sans">
                Review frequency tracking matrices to identify core study chapters and maximize exam prep efficiency.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 dark:border-zinc-800/50 bg-white/30 dark:bg-zinc-950/30 py-8 text-center text-xs text-slate-400 dark:text-zinc-500 space-y-2 mt-auto">
        <p>© 2026 StudyAI Study Assistant. All rights reserved.</p>
        <p>
          B.Sc. Honors Thesis Project submitted to the Department of Computer Science,
          Ahmadu Bello University (ABU), Zaria.
        </p>
        <p className="font-semibold text-slate-500 dark:text-zinc-400">By: Emeka Jude Ugwu | Matric: U23DLCS20099</p>
      </footer>
    </div>
  );
}
