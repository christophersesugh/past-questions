"use client";

import React from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50/50 dark:bg-[#09090b] relative overflow-hidden transition-colors duration-300">
      {/* Background glowing blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[20%] left-[10%] h-[400px] w-[400px] rounded-full bg-violet-600/10 dark:bg-violet-600/5 blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] h-[400px] w-[400px] rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-[100px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
            <BookOpen className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-transparent">
            StudyAI
          </span>
        </Link>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          AI-Powered Past Question Study Assistant
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md py-8 px-4 shadow-xl border border-slate-200/50 dark:border-zinc-800/50 sm:rounded-2xl sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
