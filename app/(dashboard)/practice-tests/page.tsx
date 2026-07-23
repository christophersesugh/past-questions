"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QuestionItem {
  id: string;
  questionId: string;
  questionText: string;
  options: string[];
  topic: string;
  correctAnswer?: string;
  selectedAnswer?: string;
  isCorrect?: boolean;
  explanation?: string;
  correctOptionIdx?: number;
}

interface Topic {
  id: string;
  name: string;
  questionCount: number;
}

export default function PracticeTestsPage() {
  const [testState, setTestState] = useState<"CONFIG" | "ACTIVE" | "RESULTS">("CONFIG");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [questionLimit, setQuestionLimit] = useState(5);
  const [difficulty, setDifficulty] = useState("ALL");

  const [activeQuestions, setActiveQuestions] = useState<QuestionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(600);
  const [testId, setTestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ score: number; totalQuestions: number; items: QuestionItem[] } | null>(null);

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    if (testState !== "ACTIVE") return;
    if (timeLeft <= 0) {
      submitExam();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, testState]);

  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/topics");
      const data = await res.json();
      if (res.ok) {
        setTopics(data.topics || []);
        // Auto-select first two if available
        if (data.topics?.length > 0) {
          setSelectedTopics(data.topics.slice(0, 2).map((t: Topic) => t.id));
        }
      }
    } catch {}
  };

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((t) => t !== topicId) : [...prev, topicId]
    );
  };

  const startExam = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/practice-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicIds: selectedTopics,
          questionCount: questionLimit,
          difficulty,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate test");

      setTestId(data.testId);
      setActiveQuestions(
        data.items.map((item: any) => ({
          id: item.id,
          questionId: item.questionId,
          questionText: item.questionText,
          options: item.options,
          topic: item.topic,
        }))
      );
      setCurrentIdx(0);
      setSelectedAnswers({});
      setTimeLeft(questionLimit * 120);
      setTestState("ACTIVE");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (optionText: string) => {
    const qId = activeQuestions[currentIdx].id;
    setSelectedAnswers({
      ...selectedAnswers,
      [qId]: optionText,
    });
  };

  const submitExam = async () => {
    if (!testId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/practice-tests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId,
          answers: selectedAnswers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");

      setResult({
        score: data.score,
        totalQuestions: data.totalQuestions,
        items: data.items,
      });
      setTestState("RESULTS");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setTestState("CONFIG");
    setResult(null);
    setTestId(null);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-zinc-50 flex items-center gap-2">
            <Award className="h-6 w-6 text-violet-500" />
            Practice Quizzes
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Test your knowledge under timed conditions with AI-generated exam simulation.
          </p>
          {error && <p className="text-xs text-red-500 mt-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-2 rounded-xl">{error}</p>}
        </div>
        {testState === "ACTIVE" && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold font-mono">
            <Clock className="h-4 w-4 animate-pulse" />
            Time Left: {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {testState === "CONFIG" && (
        <div className="max-w-3xl mx-auto">
          <Card className="border-slate-200/50 dark:border-zinc-800/50 shadow-sm bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sliders className="h-5 w-5 text-violet-500" />
                Configure Practice Session
              </CardTitle>
              <CardDescription>Select topic domains, count, and difficulty to generate quiz. Upload papers first to unlock topics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {topics.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800">
                  <p className="text-xs text-slate-500 dark:text-zinc-400">No topics available yet. Upload past question papers to generate your first practice test.</p>
                  <Button asChild variant="outline" size="sm" className="mt-3 rounded-xl">
                    <a href="/uploads">Go to Uploads</a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Select Topics ({topics.length} available)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {topics.map((topic) => {
                      const isChecked = selectedTopics.includes(topic.id);
                      return (
                        <button
                          key={topic.id}
                          onClick={() => handleTopicToggle(topic.id)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs font-bold text-left transition-all ${
                            isChecked
                              ? "bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400 shadow-sm"
                              : "bg-slate-50/50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100/50"
                          }`}
                        >
                          <div
                            className={`h-4.5 w-4.5 rounded-md flex items-center justify-center border transition-all ${
                              isChecked
                                ? "bg-violet-600 border-transparent text-white"
                                : "border-slate-300 dark:border-zinc-700"
                            }`}
                          >
                            {isChecked && <span className="text-[10px]">✔</span>}
                          </div>
                          <div className="flex flex-col">
                            <span>{topic.name}</span>
                            <span className="text-[10px] font-normal opacity-70">{topic.questionCount} questions</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Number of Questions
                  </label>
                  <div className="flex gap-2">
                    {[5, 10, 15].map((num) => (
                      <Button
                        key={num}
                        variant={questionLimit === num ? "default" : "outline"}
                        onClick={() => setQuestionLimit(num)}
                        className="flex-1 h-10 rounded-xl text-xs font-bold"
                      >
                        {num} Qs
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Difficulty Level
                  </label>
                  <div className="flex gap-2">
                    {["ALL", "EASY", "MEDIUM", "HARD"].map((diff) => (
                      <Button
                        key={diff}
                        variant={difficulty === diff ? "default" : "outline"}
                        onClick={() => setDifficulty(diff)}
                        className="flex-1 h-10 rounded-xl text-xs font-bold"
                      >
                        {diff}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button
                disabled={selectedTopics.length === 0 || loading || topics.length === 0}
                onClick={startExam}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 hover:from-violet-700 hover:to-teal-600 text-white font-medium shadow-md shadow-violet-500/10 flex items-center justify-center gap-2 group transition-all"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <>Assemble Practice Exam <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {testState === "ACTIVE" && activeQuestions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-slate-200/50 dark:border-zinc-800/50 shadow-sm bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
              <CardHeader className="flex flex-row justify-between items-start pb-4 border-b border-slate-100 dark:border-zinc-800/40">
                <div className="space-y-1">
                  <Badge variant="secondary" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-none uppercase pointer-events-none text-[9px] font-bold">
                    {activeQuestions[currentIdx].topic}
                  </Badge>
                  <CardTitle className="text-base font-black mt-2">
                    Question {currentIdx + 1}
                  </CardTitle>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Weight: {difficulty}
                </span>
              </CardHeader>
              <CardContent className="py-6 space-y-6">
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 leading-relaxed font-mono">
                  {activeQuestions[currentIdx].questionText}
                </p>

                <div className="space-y-3">
                  {activeQuestions[currentIdx].options.map((opt, optionIdx) => {
                    const isSelected = selectedAnswers[activeQuestions[currentIdx].id] === opt;
                    return (
                      <button
                        key={optionIdx}
                        onClick={() => handleOptionSelect(opt)}
                        className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-xs font-medium text-left transition-all ${
                          isSelected
                            ? "bg-violet-500/10 border-violet-500/40 text-violet-600 dark:text-violet-400 shadow-sm"
                            : "bg-slate-50/50 dark:bg-zinc-900/20 border-slate-200/60 dark:border-zinc-800/50 text-slate-700 dark:text-zinc-300 hover:bg-slate-100/50"
                        }`}
                      >
                        <div
                          className={`h-5 w-5 rounded-full shrink-0 flex items-center justify-center border font-bold text-[10px] transition-all ${
                            isSelected
                              ? "bg-violet-600 border-transparent text-white"
                              : "border-slate-300 dark:border-zinc-700 text-slate-400"
                          }`}
                        >
                          {String.fromCharCode(65 + optionIdx)}
                        </div>
                        <span className="leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-slate-100 dark:border-zinc-800/40 pt-4">
                <Button
                  variant="outline"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(currentIdx - 1)}
                  className="rounded-xl border-slate-200 dark:border-zinc-800 text-xs font-semibold"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                {currentIdx < activeQuestions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentIdx(currentIdx + 1)}
                    className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={submitExam}
                    disabled={loading}
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-xs shadow-md shadow-emerald-500/10"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : null}
                    Finish and Submit
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-200/50 dark:border-zinc-800/50 shadow-sm bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Question Tracker
                </CardTitle>
                <CardDescription>Click to jump directly to any question</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {activeQuestions.map((q, idx) => {
                    const isCurrent = idx === currentIdx;
                    const isAnswered = selectedAnswers[q.id] !== undefined;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(idx)}
                        className={`h-9 w-9 rounded-lg border text-xs font-bold transition-all flex items-center justify-center ${
                          isCurrent
                            ? "bg-violet-600 border-transparent text-white shadow-md shadow-violet-500/10"
                            : isAnswered
                            ? "bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400"
                            : "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {testState === "RESULTS" && result && (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
          <Card className="border-slate-200/50 dark:border-zinc-800/50 shadow-lg bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md text-center p-6 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-violet-600 to-teal-500" />
            <div className="mx-auto h-20 w-20 rounded-full border-4 border-violet-500/30 flex items-center justify-center text-slate-800 dark:text-zinc-50 font-black text-2xl bg-violet-500/10">
              {result.score}/{result.totalQuestions}
            </div>
            <div>
              <CardTitle className="text-xl font-black">
                {result.score / result.totalQuestions >= 0.7 ? "Well done! Exam Passed." : "Keep studying! Try again."}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Accuracy score: {Math.round((result.score / result.totalQuestions) * 100)}%
              </CardDescription>
            </div>
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={handleRestart}
                className="h-10 rounded-xl bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-xs font-semibold"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Configure New Quiz
              </Button>
            </div>
          </Card>

          <div className="space-y-6">
            <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">
              Evaluation & Explanations
            </h3>

            {result.items.map((q, idx) => {
              const isCorrect = q.isCorrect;
              return (
                <Card
                  key={q.id}
                  className={`border-slate-200/50 dark:border-zinc-800/50 shadow-sm bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md relative overflow-hidden`}
                >
                  <div
                    className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                      isCorrect ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                  <CardHeader className="pb-3 flex flex-row justify-between items-start">
                    <div className="space-y-1">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-zinc-900 dark:text-zinc-400 pointer-events-none border-none text-[8.5px] font-bold">
                        {q.topic || (q as any).topic || "General"}
                      </Badge>
                      <CardTitle className="text-xs font-extrabold mt-2 flex items-center gap-2">
                        {isCorrect ? (
                          <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                        )}
                        Question {idx + 1}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    <p className="font-semibold leading-relaxed text-slate-700 dark:text-zinc-300 font-mono">
                      {(q as any).questionText || (q as any).question?.content}
                    </p>

                    <div className="space-y-2">
                      {(q as any).options?.map((opt: string, optIdx: number) => {
                        const wasSelected = q.selectedAnswer === opt;
                        const isCorrectOpt = q.correctAnswer === opt;
                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border text-[11px] font-medium leading-relaxed ${
                              isCorrectOpt
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                : wasSelected
                                ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                                : "bg-slate-50/50 dark:bg-zinc-900/10 border-slate-100 dark:border-zinc-800 text-slate-500"
                            }`}
                          >
                            <span className="font-bold mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                            {opt}
                            {isCorrectOpt && <span className="font-bold ml-2">✓ Correct Option</span>}
                            {wasSelected && !isCorrectOpt && <span className="font-bold ml-2">✗ Selected Option</span>}
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/10 space-y-1.5 mt-2">
                      <h4 className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5 animate-pulse" />
                        AI Explanation
                      </h4>
                      <p className="text-slate-600 dark:text-zinc-400 leading-relaxed font-sans text-[11px]">
                        {q.explanation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
