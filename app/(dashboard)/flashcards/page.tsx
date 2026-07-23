"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  ChevronLeft,
  RefreshCw,
  Check,
  X,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Trophy,
  Plus
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  sourceQuestion?: string;
  topicId?: string;
}

interface FlashcardDeck {
  id: string;
  topicName: string;
  cardCount: number;
  lastStudied: string;
  mastery: number;
  topicId?: string;
  cards: Flashcard[];
}

interface TopicItem {
  id: string;
  name: string;
  questionCount: number;
}

export default function FlashcardsPage() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCardsCount, setKnownCardsCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [flashRes, topicRes] = await Promise.all([
        fetch("/api/flashcards"),
        fetch("/api/topics"),
      ]);

      const flashData = await flashRes.json();
      const topicData = await topicRes.json();

      if (flashRes.ok) {
        setDecks(flashData.decks || []);
      }
      if (topicRes.ok) {
        setTopics(topicData.topics || []);
      }
    } catch (e) {
      setError("Failed to load flashcards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const startDeckStudy = (deck: FlashcardDeck) => {
    setActiveDeck(deck);
    setCurrentCardIdx(0);
    setIsFlipped(false);
    setKnownCardsCount(0);
    setShowSummary(false);
  };

  const handleCardFeedback = (isKnown: boolean) => {
    if (isKnown) {
      setKnownCardsCount((prev) => prev + 1);
    }
    setIsFlipped(false);
    setTimeout(() => {
      if (activeDeck && currentCardIdx < activeDeck.cards.length - 1) {
        setCurrentCardIdx((prev) => prev + 1);
      } else {
        setShowSummary(true);
      }
    }, 200);
  };

  const handleRestartDeck = () => {
    setCurrentCardIdx(0);
    setIsFlipped(false);
    setKnownCardsCount(0);
    setShowSummary(false);
  };

  const handleFinishDeck = () => {
    if (activeDeck) {
      const finalMastery = Math.round((knownCardsCount / activeDeck.cards.length) * 100);
      setDecks(
        decks.map((d) =>
          d.id === activeDeck.id
            ? { ...d, mastery: finalMastery, lastStudied: "Just now" }
            : d
        )
      );
    }
    setActiveDeck(null);
  };

  const handleGenerate = async (topicId: string) => {
    setGenerating(topicId);
    setError("");
    try {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-zinc-50 flex items-center gap-2">
            <Brain className="h-6 w-6 text-violet-500" />
            Flashcard Decks
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Revise key terms and concepts using active recall flashcards.
          </p>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
        {activeDeck && (
          <Button
            variant="ghost"
            onClick={handleFinishDeck}
            className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Exit Study
          </Button>
        )}
      </div>

      {!activeDeck ? (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl bg-slate-100 dark:bg-zinc-900 animate-pulse" />)}
            </div>
          ) : decks.length === 0 ? (
            <div className="space-y-6">
              <Card className="border-slate-200/50 dark:border-zinc-800/50 shadow-sm bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md p-12 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500 mb-4">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-zinc-100">No flashcards yet</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 max-w-sm mx-auto">
                  Upload past question papers, then generate flashcards from detected topics. Topics with questions will appear below.
                </p>
              </Card>

              {topics.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300 mb-3">Available Topics to Generate</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {topics.map(t => (
                      <Card key={t.id} className="border-slate-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 p-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{t.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400">{t.questionCount} questions</p>
                        </div>
                        <Button size="sm" disabled={!!generating} onClick={() => handleGenerate(t.id)} className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs">
                          {generating === t.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <><Sparkles className="h-3 w-3 mr-1" /> Generate</>}
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {decks.map((deck) => (
                  <Card
                    key={deck.id}
                    className="border-slate-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md transition-all duration-300 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md flex flex-col group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="rounded-md font-bold px-2 py-0.5 text-[9px] bg-violet-500/10 text-violet-600 dark:text-violet-400 border-none uppercase pointer-events-none">
                          {deck.cardCount} cards
                        </Badge>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold flex items-center gap-1">
                          Studied {deck.lastStudied}
                        </span>
                      </div>
                      <CardTitle className="text-base font-extrabold text-slate-800 dark:text-zinc-100 mt-3 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {deck.topicName}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Review concepts from your uploaded papers
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-end space-y-4 pt-0">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                          <span>Topic Mastery</span>
                          <span>{deck.mastery}%</span>
                        </div>
                        <Progress value={deck.mastery} className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-900 overflow-hidden" />
                      </div>
                      <Button
                        onClick={() => startDeckStudy(deck)}
                        className="w-full h-10 rounded-xl bg-slate-50 dark:bg-zinc-900/60 hover:bg-violet-600 dark:hover:bg-violet-600 border border-slate-200 dark:border-zinc-800 hover:border-transparent text-slate-700 dark:text-zinc-300 hover:text-white dark:hover:text-white font-medium group transition-all"
                      >
                        Start Studying
                        <ArrowRight className="h-4 w-4 ml-1.5 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {topics.length > decks.length && (
                <div className="pt-6">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300 mb-3 flex items-center gap-2"><Plus className="h-4 w-4" /> Generate More Decks</h3>
                  <div className="flex flex-wrap gap-2">
                    {topics.filter(t => !decks.some(d => d.topicName === t.name)).map(t => (
                      <Button key={t.id} variant="outline" size="sm" disabled={!!generating} onClick={() => handleGenerate(t.id)} className="rounded-xl text-xs">
                        {generating === t.id ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                        {t.name} ({t.questionCount})
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : showSummary ? (
        <div className="max-w-md mx-auto">
          <Card className="border-slate-200/50 dark:border-zinc-800/50 shadow-lg bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md text-center p-6 space-y-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-tr from-violet-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
              <Trophy className="h-8 w-8 animate-bounce-subtle" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Deck Completed!</CardTitle>
              <CardDescription className="text-xs mt-1">
                You successfully reviewed all cards in <strong>{activeDeck.topicName}</strong>.
              </CardDescription>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800/30 space-y-3">
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-zinc-400">
                <span>Total Cards:</span>
                <span>{activeDeck.cards.length}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-zinc-400">
                <span>Got on first try:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{knownCardsCount} ({Math.round((knownCardsCount / activeDeck.cards.length) * 100)}%)</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRestartDeck}
                className="flex-1 h-11 rounded-xl bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Study Again
              </Button>
              <Button
                onClick={handleFinishDeck}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 hover:from-violet-700 hover:to-teal-600 text-white font-medium shadow-md shadow-violet-500/10"
              >
                Done
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-zinc-400 font-semibold">
            <span>Reviewing: {activeDeck.topicName}</span>
            <span>Card {currentCardIdx + 1} of {activeDeck.cards.length}</span>
          </div>
          <Progress
            value={(currentCardIdx / activeDeck.cards.length) * 100}
            className="h-2 rounded-full bg-slate-100 dark:bg-zinc-900 overflow-hidden"
          />

          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative h-[320px] w-full cursor-pointer perspective-1000 group"
          >
            <div
              className={cn(
                "absolute inset-0 w-full h-full rounded-3xl transition-transform duration-500 ease-out preserve-3d shadow-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950",
                isFlipped && "rotate-y-180"
              )}
            >
              <div className="absolute inset-0 w-full h-full p-8 flex flex-col justify-between backface-hidden">
                <Badge variant="outline" className="w-fit text-[9px] font-bold uppercase tracking-wider text-slate-400 pointer-events-none">
                  Front (Question / Term)
                </Badge>
                <div className="flex-1 flex items-center justify-center text-center">
                  <p className="text-base md:text-lg font-bold text-slate-800 dark:text-zinc-50 leading-relaxed font-mono">
                    {activeDeck.cards[currentCardIdx].front}
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 text-center flex items-center justify-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5" />
                  Click card to flip and view explanation
                </div>
              </div>

              <div className="absolute inset-0 w-full h-full p-8 flex flex-col justify-between backface-hidden rotate-y-180">
                <Badge variant="outline" className="w-fit text-[9px] font-bold uppercase tracking-wider text-violet-500 border-violet-500/25 pointer-events-none">
                  Back (Explanation)
                </Badge>
                <div className="flex-1 flex items-center justify-center text-center overflow-y-auto">
                  <p className="text-sm md:text-base font-medium text-slate-700 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {activeDeck.cards[currentCardIdx].back}
                  </p>
                </div>
                {activeDeck.cards[currentCardIdx].sourceQuestion && (
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/40 text-[9px] text-left text-slate-400 dark:text-zinc-500">
                    <span className="font-semibold text-violet-500">Derived from paper:</span> {activeDeck.cards[currentCardIdx].sourceQuestion}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            {!isFlipped ? (
              <Button
                onClick={() => setIsFlipped(true)}
                className="h-12 px-8 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium shadow-md shadow-violet-500/10 flex items-center gap-2"
              >
                Reveal Answer
                <RefreshCw className="h-4 w-4 animate-spin-slow" />
              </Button>
            ) : (
              <div className="flex gap-4 w-full sm:w-auto">
                <Button
                  onClick={() => handleCardFeedback(false)}
                  className="flex-1 sm:flex-initial h-12 px-6 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Need Practice
                </Button>
                <Button
                  onClick={() => handleCardFeedback(true)}
                  className="flex-1 sm:flex-initial h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  I Know This!
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
