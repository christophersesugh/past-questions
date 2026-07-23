"use client";

import React, { useState, useRef, useEffect } from "react";
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

interface QuestionItem {
  id: string;
  content: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topic: string;
  topicId?: string | null;
}

interface UploadedFile {
  id: string;
  name: string;
  filename: string;
  size: string;
  date: string;
  createdAt: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR";
  questionCount?: number;
  questions: QuestionItem[];
}

export default function UploadsPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/uploads");
      const data = await res.json();
      if (res.ok) {
        setFiles(data.uploads || []);
      } else {
        setError(data.error || "Failed to fetch uploads");
      }
    } catch (e) {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const handleUpload = async (file: File) => {
    const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " MB";
    setIsUploading(true);
    setUploadingFileName(file.name);
    setUploadProgress(10);
    setError("");

    // Optimistic progress simulation while real upload processes
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + Math.random() * 10 : prev));
    }, 500);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        setError(data.error || "Upload failed");
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 1000);
        return;
      }

      setTimeout(async () => {
        setIsUploading(false);
        setUploadProgress(0);
        await fetchUploads();
      }, 800);
    } catch (err) {
      clearInterval(progressInterval);
      setError("Upload failed. Check file format.");
      setIsUploading(false);
      setUploadProgress(0);
    }
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
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteFile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this document and all its extracted questions?")) return;
    try {
      const res = await fetch(`/api/uploads/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFiles(files.filter((f) => f.id !== id));
        if (selectedFile?.id === id) setSelectedFile(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch {
      alert("Failed to delete file");
    }
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
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
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

              {isUploading && (
                <div className="p-4 rounded-2xl border border-violet-200/50 dark:border-violet-800/30 bg-violet-500/5 backdrop-blur-sm space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300 truncate max-w-[180px]">
                      {uploadingFileName}
                    </span>
                    <span className="text-violet-600 dark:text-violet-400 font-bold">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                  <Progress value={uploadProgress} className="h-2 rounded-full bg-slate-100 dark:bg-zinc-900 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-600 to-teal-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </Progress>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-violet-500 animate-spin" />
                    Extracting questions with AI engine...
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
              <CardDescription>
                {loading ? "Loading..." : `${files.length} document${files.length !== 1 ? "s" : ""} in library`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-zinc-900 animate-pulse" />)}
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-zinc-400">No documents yet. Upload your first past question paper.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-zinc-800/60 pb-3 text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                        <th className="pb-3 font-medium">Document Name</th>
                        <th className="pb-3 font-medium">Size</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Date</th>
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
                              {file.questionCount !== undefined && (
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
                                  : file.status === "PROCESSING" || file.status === "PENDING"
                                  ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                  : "bg-red-500/10 text-red-600 dark:text-red-400"
                              )}
                            >
                              {file.status === "COMPLETED" && (
                                <CheckCircle className="h-3 w-3 mr-1 inline-block" />
                              )}
                              {(file.status === "PROCESSING" || file.status === "PENDING") && (
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
              )}
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
