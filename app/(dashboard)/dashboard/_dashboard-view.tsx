"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  MessageSquare,
  Sparkles,
  Brain,
  Award,
  Plus,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type {
  DashboardStats,
  RecentActivity,
  RecommendedTopic,
} from "@/lib/dashboard";

const ICON_MAP = {
  upload: FileText,
  quiz: Award,
  chat: MessageSquare,
} as const;

const COLOR_MAP = {
  "Uploaded Papers": "from-blue-500 to-cyan-500",
  "Extracted Questions": "from-violet-500 to-purple-500",
  "Flashcards Studied": "from-teal-500 to-emerald-500",
  "Practice Tests": "from-amber-500 to-orange-500",
} as const;

const TEXT_COLOR_MAP = {
  "Uploaded Papers": "text-blue-600 dark:text-blue-400",
  "Extracted Questions": "text-violet-600 dark:text-violet-400",
  "Flashcards Studied": "text-teal-600 dark:text-teal-400",
  "Practice Tests": "text-amber-600 dark:text-amber-400",
} as const;

const BG_LIGHT_MAP = {
  "Uploaded Papers": "bg-blue-500/10",
  "Extracted Questions": "bg-violet-500/10",
  "Flashcards Studied": "bg-teal-500/10",
  "Practice Tests": "bg-amber-500/10",
} as const;

const ICON_FOR_STAT = {
  "Uploaded Papers": FileText,
  "Extracted Questions": Sparkles,
  "Flashcards Studied": Brain,
  "Practice Tests": Award,
} as const;

const STAT_DESCRIPTIONS = {
  "Uploaded Papers": "PDF/DOCX documents",
  "Extracted Questions": "Parsed & tagged by AI",
  "Flashcards Studied": "Active recall cards",
  "Practice Tests": "Average score",
} as const;

const STAT_TITLES = [
  "Uploaded Papers",
  "Extracted Questions",
  "Flashcards Studied",
  "Practice Tests",
] as const;

export function DashboardView({
  userName,
  stats,
  activities,
  recommendedTopics,
}: {
  userName: string;
  stats: DashboardStats;
  activities: RecentActivity[];
  recommendedTopics: RecommendedTopic[];
}) {
  const statCards = STAT_TITLES.map((title) => {
    const value =
      title === "Uploaded Papers"
        ? String(stats.uploads)
        : title === "Extracted Questions"
        ? String(stats.questions)
        : title === "Flashcards Studied"
        ? String(stats.flashcardsStudied)
        : title === "Practice Tests"
        ? String(stats.practiceTests)
        : "0";
    const description =
      title === "Practice Tests"
        ? stats.averageScore === null
          ? "No tests yet"
          : `Average score: ${stats.averageScore}%`
        : STAT_DESCRIPTIONS[title];
    return { title, value, description, icon: ICON_FOR_STAT[title] };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-zinc-900 to-zinc-950 dark:from-zinc-950 dark:to-black text-white p-8 md:p-10 shadow-lg border border-white/5">
        <div className="absolute top-0 right-0 h-full w-1/3 opacity-20 pointer-events-none">
          <div className="absolute -top-[20%] -right-[20%] h-[150%] w-[150%] rounded-full bg-violet-600 blur-[80px]" />
        </div>
        <div className="relative z-10 space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            AI Companion is Online
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-violet-400 to-teal-300 bg-clip-text text-transparent">
              {userName}
            </span>
            !
          </h2>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            {stats.uploads === 0
              ? "Upload a past paper to get started. We'll extract questions, identify topics, and personalize your revision."
              : `You have ${stats.questions} questions across ${stats.uploads} papers. Open the AI Tutor or generate a practice test to begin.`}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium shadow-lg shadow-violet-500/20">
              <Link href="/chat">
                Ask AI Tutor
                <MessageSquare className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl border-white/10 hover:bg-white/10 text-white hover:text-white dark:bg-transparent bg-transparent">
              <Link href="/uploads">
                Upload New Paper
                <Plus className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="overflow-hidden border-slate-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md transition-all duration-300 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md relative group">
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${COLOR_MAP[stat.title]} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <div className={`p-2.5 rounded-xl ${BG_LIGHT_MAP[stat.title]} ${TEXT_COLOR_MAP[stat.title]}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800 dark:text-zinc-50 tracking-tight">
                  {stat.value}
                </div>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Core Split Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200/50 dark:border-zinc-800/50 shadow-sm bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-base font-bold">Weekly Study Goals</CardTitle>
              <CardDescription>Track questions reviewed this week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Detailed weekly analytics will appear once you begin reviewing questions.
              </p>
              <Progress value={0} className="h-3 rounded-full bg-slate-100 dark:bg-zinc-900 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-600 to-teal-500 rounded-full" />
              </Progress>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                <Calendar className="h-4 w-4" />
                Weekly tracking
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/50 dark:border-zinc-800/50 shadow-sm bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Suggested Revision Focus</CardTitle>
                <CardDescription>
                  {recommendedTopics.length === 0
                    ? "Upload papers to see topic recommendations"
                    : "Prioritized based on question frequency vs accuracy"}
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-violet-600 dark:text-violet-400 hover:text-violet-700">
                <Link href="/recommendations">
                  View Insights
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendedTopics.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-zinc-500">
                  No topics yet. Upload your first past paper to populate this list.
                </p>
              ) : (
                recommendedTopics.map((topic) => (
                  <div
                    key={topic.name}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800/30 hover:border-violet-500/30 dark:hover:border-violet-500/20 transition-all duration-300 group"
                  >
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {topic.name}
                      </h4>
                      <div className="flex gap-4 text-xs text-slate-500 dark:text-zinc-400">
                        <span>
                          Exam Frequency:{" "}
                          <strong className="font-semibold text-slate-700 dark:text-zinc-300">
                            {topic.frequency}%
                          </strong>
                        </span>
                        <span>
                          Average Accuracy:{" "}
                          <strong className="font-semibold text-slate-700 dark:text-zinc-300">
                            {topic.accuracy}%
                          </strong>
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        topic.status === "High Priority"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : topic.status === "Needs Review"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {topic.status}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full border-slate-200/50 dark:border-zinc-800/50 shadow-sm bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md flex flex-col">
            <CardHeader>
              <CardTitle className="text-base font-bold">Recent Study Activity</CardTitle>
              <CardDescription>Log of past operations & sessions</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-zinc-500">
                  No activity yet. Once you upload papers and start studying, your recent actions will appear here.
                </p>
              ) : (
                activities.map((act) => {
                  const Icon = ICON_MAP[act.type];
                  return (
                    <div key={act.id} className="relative pl-6 border-l border-slate-200 dark:border-zinc-800 pb-1 last:pb-0 space-y-1">
                      <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-slate-300 dark:bg-zinc-700 ring-4 ring-white dark:ring-zinc-950" />
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 min-w-0">
                          <Icon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{act.title}</span>
                        </span>
                        <span className="text-slate-400 dark:text-zinc-500 shrink-0">{act.time}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${act.badgeColor}`}>
                          {act.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
