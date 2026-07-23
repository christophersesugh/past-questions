"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import {
  LayoutDashboard,
  UploadCloud,
  MessageSquare,
  Brain,
  Award,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  description: string;
}

const sidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & progress",
  },
  {
    name: "Upload Papers",
    href: "/uploads",
    icon: UploadCloud,
    description: "Ingest past questions",
  },
  {
    name: "AI Tutor Chat",
    href: "/chat",
    icon: MessageSquare,
    description: "Interactive revision",
  },
  {
    name: "Flashcards",
    href: "/flashcards",
    icon: Brain,
    description: "Active recall study",
  },
  {
    name: "Practice Tests",
    href: "/practice-tests",
    icon: Award,
    description: "Mock exams",
  },
  {
    name: "Recommendations",
    href: "/recommendations",
    icon: TrendingUp,
    description: "Exam trends & insights",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-[#09090b] transition-colors duration-300">
      {/* Background Gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] h-[80%] w-[80%] rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-[40%] -right-[20%] h-[80%] w-[80%] rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-[120px] pointer-events-none" />
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md transition-all duration-300 ease-in-out relative z-30",
          isSidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Brand / Logo */}
        <div className="flex h-16 items-center px-6 border-b border-slate-200/80 dark:border-zinc-800/80 justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-violet-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            {!isSidebarCollapsed && (
              <span className="bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-transparent font-bold tracking-tight text-lg animate-pulse-subtle">
                StudyAI
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="h-8 w-8 text-slate-500 dark:text-zinc-400 hidden lg:flex"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                  isActive
                    ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900/80 hover:text-slate-900 dark:hover:text-zinc-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                    isActive ? "text-violet-600 dark:text-violet-400" : "text-slate-500 dark:text-zinc-500"
                  )}
                />
                {!isSidebarCollapsed && (
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">
                      {item.description}
                    </span>
                  </div>
                )}
                {/* Active side indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full bg-violet-600" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className="p-4 border-t border-slate-200/80 dark:border-zinc-800/80">
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all w-full",
              isSidebarCollapsed && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Overlay Navigation) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm">
          <div className="w-64 bg-white dark:bg-zinc-950 p-5 border-r border-slate-200 dark:border-zinc-800 flex flex-col animate-slide-in">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-lg bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-transparent">
                StudyAI Menu
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="h-8 w-8 text-slate-500"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-2">
              {sidebarItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-slate-200 dark:border-zinc-800 pt-4">
              <button
                onClick={() => {
                  signOut({ callbackUrl: "/auth/login" });
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 w-full"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <header className="h-16 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md flex items-center justify-between px-6 z-20 sticky top-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-slate-500"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-slate-800 dark:text-zinc-100 hidden sm:block">
              {sidebarItems.find((item) => pathname.startsWith(item.href))?.name || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar - Visual Mockup */}
            <div className="relative max-w-xs hidden lg:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search topics, questions..."
                className="w-64 rounded-full border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 py-2 pl-9 pr-4 text-xs outline-none focus:border-violet-500 dark:focus:border-violet-400 focus:ring-1 focus:ring-violet-500 dark:focus:ring-violet-400 transition-all text-slate-700 dark:text-zinc-300"
              />
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 rounded-full text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 p-1.5 h-9 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                  <div className="h-6 w-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-semibold">
                    {userInitials}
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 hidden md:inline-block pr-1">
                    {session?.user?.name || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-1 rounded-xl">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{session?.user?.name || "User"}</span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-normal">{session?.user?.email || ""}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 dark:text-red-400"
                  onClick={() => signOut({ callbackUrl: "/auth/login" })}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
