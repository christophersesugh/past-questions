"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Trash2,
  Sparkles,
  ArrowRight,
  Filter,
  Search,
  BookOpen
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  date: string;
  status: "COMPLETED" | "PROCESSING" | "ERROR";
  questionCount?: number;
  questions: Array<{
    id: string;
    content: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    topic: string;
  }>;
}

const mockFiles: UploadedFile[] = [
  {
    id: "up-1",
    name: "COSC 301 - Operating Systems 2024.pdf",
    size: "2.4 MB",
    date: "Jun 28, 2026",
    status: "COMPLETED",
    questionCount: 15,
    questions: [
      {
        id: "q-1-1",
        content: "What is the critical section problem? Detail the three requirements that must be met by any valid solution.",
        difficulty: "HARD",
        topic: "Process Synchronization",
      },
      {
        id: "q-1-2",
        content: "Define mutual exclusion and discuss how semaphores can be used to solve synchronization issues.",
        difficulty: "MEDIUM",
        topic: "Process Synchronization",
      },
      {
        id: "q-1-3",
        content: "Explain the difference between paging and segmentation in memory management. Provide a diagrammatic comparison.",
        difficulty: "MEDIUM",
        topic: "Memory Management",
      },
      {
        id: "q-1-4",
        content: "What is thrashing? How can a system detect thrashing, and what actions can be taken to mitigate it?",
        difficulty: "HARD",
        topic: "Memory Management",
      },
      {
        id: "q-1-5",
        content: "Briefly explain the role of a short-term CPU scheduler. How does it differ from a long-term scheduler?",
        difficulty: "EASY",
        topic: "CPU Scheduling",
      },
    ],
  },
  {
    id: "up-2",
    name: "COSC 303 - Database Systems 2025.docx",
    size: "1.2 MB",
    date: "Jun 29, 2026",
    status: "COMPLETED",
    questionCount: 12,
    questions: [
      {
        id: "q-2-1",
        content: "Given a schema R(A, B, C, D, E) with functional dependencies F = {A -> BC, CD -> E, B -> D}, identify the candidate keys and determine the highest normal form of R.",
        difficulty: "HARD",
        topic: "Database Normalization",
      },
      {
        id: "q-2-2",
        content: "Explain the ACID properties of database transactions. Why is durability critical?",
        difficulty: "EASY",
        topic: "Transaction Management",
      },
      {
        id: "q-2-3",
        content: "Describe the two-phase locking (2PL) protocol. How does it guarantee serializability?",
        difficulty: "MEDIUM",
        topic: "Transaction Management",
      },
    ],
  },
  {
    id: "up-3",
    name: "COSC 311 - Software Engineering 2025.pdf",
    size: "3.8 MB",
    date: "Jun 30, 2026",
    status: "PROCESSING",
    questions: [],
  },
  {
    id: "up-4",
    name: "COSC 305 - Computer Architecture 2023.pdf",
    size: "5.1 MB",
    date: "May 12, 2026",
    status: "ERROR",
    questions: [],
  },
];

export default function UploadsPage() {
  const [files, setFiles] = useState<UploadedFile[]>(mockFiles);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload State Simulation
  const simulateUpload = (fileName: string, fileSizeStr: string) => {
    setIsUploading(true);
    setUploadingFileName(fileName);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            const newFile: UploadedFile = {
              id: `up-${Date.now()}`,
              name: fileName,
              size: fileSizeStr,
              date: new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              status: "COMPLETED",
              questionCount: 4,
              questions: [
                {
                  id: `q-new-1`,
                  content: `Sample theoretical question extracted from ${fileName}.`,
                  difficulty: "MEDIUM",
                  topic: "General Revision",
                },
                {
                  id: `q-new-2`,
                  content: `Identify the main system architecture details described in ${fileName}.`,
                  difficulty: "HARD",
                  topic: "System Design",
                },
              ],
            };
            setFiles((prevFiles) => [newFile, ...prevFiles]);
          }, 800);
          return 100;
        }
        return prev + 15;
      });
    }, 300);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      simulateUpload(file.name, sizeStr);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      simulateUpload(file.name, sizeStr);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(files.filter((f) => f.id !== id));
  };

  const filteredQuestions = selectedFile
    ? selectedFile.questions.filter((q) => {
        const matchesSearch = q.content.toLowerCase().includes(searchQuery.toLowerCase()) || q.topic.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDiff = difficultyFilter === "ALL" || q.difficulty === difficultyFilter;
        return matchesSearch && matchesDiff;
      })
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-zinc-50">
          Upload & Ingest Papers
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Add past exam sheets to segment individual questions and generate learning aids.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ingestion Dropzone */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200/50 dark:border-zinc-800/50 shadow-sm bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-base font-bold">New Document</CardTitle>
              <CardDescription>Supported formats: PDF, DOCX, TXT (Max 15MB)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[220px]",
                  isDragging
                    ? "border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 scale-98"
                    : "border-slate-200 dark:border-zinc-800 hover:border-violet-500/50 dark:hover:border-violet-500/30 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30"
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                />
                <div className="p-4 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 mb-4 animate-bounce-subtle">
                  <Upload className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Drag & drop file here
                </h4>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                  or click to select from your device
                </p>
              </div>

              {/* In-progress Upload Indicator */}
              {isUploading && (
                <div className="p-4 rounded-2xl border border-violet-200/50 dark:border-violet-800/30 bg-violet-500/5 backdrop-blur-sm space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300 truncate max-w-[180px]">
                      {uploadingFileName}
                    </span>
                    <span className="text-violet-600 dark:text-violet-400 font-bold">
                      {uploadProgress}%
                    </span>
                  </div>
                  <Progress value={uploadProgress} className="h-2 rounded-full bg-slate-100 dark:bg-zinc-900 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-600 to-teal-500 rounded-full transition-all" />
                  </Progress>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-violet-500 animate-spin" />
                    Extracting questions with OCR engine...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Files Library List */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200/50 dark:border-zinc-800/50 shadow-sm bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-base font-bold">Document Library</CardTitle>
              <CardDescription>Manage and view processed question sheets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-zinc-800/60 pb-3 text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                      <th className="pb-3 font-medium">Document Name</th>
                      <th className="pb-3 font-medium">Size</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Date Uploaded</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/40">
                    {files.map((file) => (
                      <tr
                        key={file.id}
                        onClick={() => file.status === "COMPLETED" && setSelectedFile(file)}
                        className={cn(
                          "group hover:bg-slate-50/50 dark:hover:bg-zinc-900/20 transition-all",
                          file.status === "COMPLETED" && "cursor-pointer"
                        )}
                      >
                        <td className="py-4 pr-3 font-semibold text-slate-700 dark:text-zinc-200 flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-500 dark:text-zinc-400">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="truncate max-w-[220px] sm:max-w-xs flex flex-col">
                            <span>{file.name}</span>
                            {file.questionCount && (
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">
                                {file.questionCount} questions parsed
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-slate-500 dark:text-zinc-400 text-xs">
                          {file.size}
                        </td>
                        <td className="py-4">
                          <Badge
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-semibold border-none pointer-events-none",
                              file.status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : file.status === "PROCESSING"
                                ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                : "bg-red-500/10 text-red-600 dark:text-red-400"
                            )}
                          >
                            {file.status === "COMPLETED" && (
                              <CheckCircle className="h-3 w-3 mr-1 inline-block" />
                            )}
                            {file.status === "PROCESSING" && (
                              <Clock className="h-3 w-3 mr-1 inline-block animate-spin" />
                            )}
                            {file.status === "ERROR" && (
                              <AlertCircle className="h-3 w-3 mr-1 inline-block" />
                            )}
                            {file.status}
                          </Badge>
                        </td>
                        <td className="py-4 text-slate-500 dark:text-zinc-400 text-xs">
                          {file.date}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {file.status === "COMPLETED" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFile(file);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-slate-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                              onClick={(e) => handleDeleteFile(file.id, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Slide-over Question Inspector Sheet */}
      <Sheet open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
        <SheetContent className="sm:max-w-lg md:max-w-xl overflow-y-auto z-50">
          <SheetHeader className="pb-4 border-b border-slate-100 dark:border-zinc-800">
            <SheetTitle className="text-base font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-violet-500" />
              Question Inspector
            </SheetTitle>
            <SheetDescription className="text-xs">
              {selectedFile?.name}
            </SheetDescription>
          </SheetHeader>

          {/* Filtering Bar */}
          <div className="py-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search questions or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
                />
              </div>
              <div className="flex gap-1">
                {["ALL", "EASY", "MEDIUM", "HARD"].map((diff) => (
                  <Button
                    key={diff}
                    variant={difficultyFilter === diff ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDifficultyFilter(diff)}
                    className="h-9 px-3 text-[10px] font-semibold rounded-xl"
                  >
                    {diff}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4 pt-2">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 dark:text-zinc-500">
                No matching questions found in this document.
              </div>
            ) : (
              filteredQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30 hover:border-violet-500/20 dark:hover:border-violet-500/10 transition-all space-y-3 group"
                >
                  <div className="flex justify-between items-start gap-2">
                    <Badge className="rounded-md px-1.5 py-0.5 text-[9px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/15 pointer-events-none border-none uppercase">
                      {q.topic}
                    </Badge>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        q.difficulty === "HARD"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : q.difficulty === "MEDIUM"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-mono">
                    Q{idx + 1}. {q.content}
                  </p>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100/50 dark:border-zinc-800/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button asChild size="sm" variant="ghost" className="h-7 text-[10px] text-violet-600 hover:text-violet-700 dark:text-violet-400">
                      <Link href="/chat">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Solve with AI Tutor
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="h-7 text-[10px] text-slate-500 dark:text-zinc-400">
                      <Link href="/practice-tests">
                        Add to Test
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
