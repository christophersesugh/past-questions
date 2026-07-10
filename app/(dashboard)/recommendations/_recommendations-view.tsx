"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  MessageSquare,
  ListTodo,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RecommendationItem } from "@/lib/recommendations";

const ZONES = [
  { label: "DANGER ZONE", cls: "bg-red-500/10 border-red-500/20", textCls: "text-red-600" },
  { label: "REVIEW ZONE", cls: "bg-amber-500/10 border-amber-500/20", textCls: "text-amber-600" },
  { label: "SAFE ZONE", cls: "bg-emerald-500/10 border-emerald-500/20", textCls: "text-emerald-600" },
] as const;

function zoneFor(item: RecommendationItem): 0 | 1 | 2 {
  if (item.priority === "CRITICAL") return 0;
  if (item.priority === "HIGH" || item.priority === "MEDIUM") return 1;
  return 2;
}

export function RecommendationsView({ items }: { items: RecommendationItem[] }) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setCompleted((c) => ({ ...c, [id]: !c[id] }));

  const grouped = [0, 1, 2].map((z) => items.filter((i) => zoneFor(i) === z));

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-zinc-50 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-violet-500" />
          Exam Insights & Recommendations
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Review frequency charts of topics in past papers combined with your test performance.
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="border-slate-200/50 dark:border-zinc-800/50 shadow-sm bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
          <CardContent className="p-12 text-center text-sm text-slate-500 dark:text-zinc-400">
            No data yet. Upload past papers and complete at least one practice test to generate recommendations.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-slate-200/50 dark:border-zinc-800/50 shadow-sm bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-violet-500" />
                  Historical Exam Topic Frequency
                </CardTitle>
                <CardDescription>
                  Percentage occurrence of topics compiled across {items.length} topic
                  {items.length === 1 ? "" : "s"} in your library
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-zinc-300">{item.topic}</span>
                      <span className="text-slate-500 dark:text-zinc-400">
                        {item.frequency}% Frequency
                      </span>
                    </div>
                    <div className="relative h-6 w-full bg-slate-100 dark:bg-zinc-900 rounded-lg overflow-hidden flex items-center">
                      <div
                        className="h-full bg-gradient-to-r from-violet-600/70 to-violet-600 rounded-lg transition-all"
                        style={{ width: `${item.frequency}%` }}
                      />
                      <span className="absolute right-3 text-[10px] font-bold text-slate-700 dark:text-zinc-300">
                        {item.frequency >= 70 ? "Core Focus" : "Supporting"}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200/50 dark:border-zinc-800/50 shadow-sm bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-base font-bold">Priority Heatmap Matrix</CardTitle>
                <CardDescription>Plotted by paper occurrence vs your accuracy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {ZONES.map((z, idx) => (
                    <div
                      key={z.label}
                      className={`p-4 rounded-2xl ${z.cls} flex flex-col justify-between min-h-[120px] text-center space-y-3`}
                    >
                      <Badge className="text-white rounded px-2 py-0.5 mx-auto border-none pointer-events-none text-[9px] font-bold bg-current/0 bg-slate-900">
                        <span className={z.textCls}>{z.label}</span>
                      </Badge>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed">
                        {grouped[idx].length === 0
                          ? "—"
                          : grouped[idx]
                              .map((i) => i.topic)
                              .join(", ")}
                      </p>
                      <span className={`text-[9px] ${z.textCls} font-bold`}>
                        {idx === 0
                          ? "High Occ. / Low Accuracy"
                          : idx === 1
                          ? "Med Occ. / Med Accuracy"
                          : "High Occ. / High Accuracy"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-200/50 dark:border-zinc-800/50 shadow-sm bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md flex flex-col h-full">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800/40">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-violet-500" />
                  AI Prioritized Tasks
                </CardTitle>
                <CardDescription>Revision tasks tailored to improve your scores</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 pt-4 overflow-y-auto">
                {items.map((item) => {
                  const isCompleted = completed[item.id] || false;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 relative overflow-hidden group ${
                        isCompleted
                          ? "bg-slate-50/50 dark:bg-zinc-900/10 border-slate-200/50 dark:border-zinc-900 opacity-60"
                          : item.priority === "CRITICAL"
                          ? "bg-red-500/5 border-red-200 dark:border-red-950/30"
                          : item.priority === "HIGH"
                          ? "bg-amber-500/5 border-amber-200 dark:border-amber-950/30"
                          : "bg-slate-50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <Badge
                          className={`rounded px-1.5 py-0.5 text-[8.5px] font-bold border-none pointer-events-none ${
                            item.priority === "CRITICAL"
                              ? "bg-red-600 text-white"
                              : item.priority === "HIGH"
                              ? "bg-amber-500 text-white"
                              : item.priority === "MEDIUM"
                              ? "bg-blue-500 text-white"
                              : "bg-slate-500 text-white"
                          }`}
                        >
                          {item.priority}
                        </Badge>
                        <button
                          onClick={() => toggle(item.id)}
                          className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center transition-all ${
                            isCompleted
                              ? "bg-emerald-500 border-transparent text-white"
                              : "border-slate-300 dark:border-zinc-700 hover:border-violet-500"
                          }`}
                        >
                          {isCompleted && <span className="text-[10px]">✔</span>}
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <h4
                          className={`text-xs font-bold text-slate-800 dark:text-zinc-200 ${
                            isCompleted && "line-through text-slate-400"
                          }`}
                        >
                          Study: {item.topic}
                        </h4>
                        <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-relaxed font-sans">
                          {item.reason}
                        </p>
                      </div>

                      {!isCompleted && (
                        <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button asChild size="sm" variant="ghost" className="h-7 text-[9px] text-violet-600 dark:text-violet-400">
                            <Link href="/chat">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Consult AI
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost" className="h-7 text-[9px] text-slate-500 dark:text-zinc-400">
                            <Link href="/flashcards">
                              Study Deck
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
