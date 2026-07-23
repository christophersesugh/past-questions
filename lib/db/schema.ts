import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { customType } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------- CUSTOM VECTOR TYPE ----------
export const vector = (name: string, dimensions?: number) =>
  customType<{ data: number[]; driverData: string; config: { dimensions?: number } }>({
    dataType(config) {
      const dim = config?.dimensions ?? dimensions;
      return dim ? `vector(${dim})` : `vector`;
    },
    toDriver(value: number[]): string {
      // Drizzle expects driver data as string like "[0.1,0.2]"
      return JSON.stringify(value);
    },
    fromDriver(value: string): number[] {
      // neon returns string "[...]" or already parsed
      if (typeof value === "string") {
        try {
          // handle pgvector format "[0.1,0.2]" is JSON valid
          return JSON.parse(value);
        } catch {
          // fallback parse manually "[1,2,3]"
          return value
            .replace(/^\s*\[|\]\s*$/g, "")
            .split(",")
            .map((s) => parseFloat(s.trim()))
            .filter((n) => !isNaN(n));
        }
      }
      return value as unknown as number[];
    },
  })(name, { dimensions });

// ---------- Enums ----------
export const difficultyEnum = pgEnum("Difficulty", ["EASY", "MEDIUM", "HARD"]);
export const chatRoleEnum = pgEnum("ChatRole", ["USER", "ASSISTANT"]);
export const uploadStatusEnum = pgEnum("UploadStatus", ["PENDING", "PROCESSING", "COMPLETED", "ERROR"]);

// ---------- Users ----------
export const users = pgTable("User", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

// ---------- Topics ----------
export const topics = pgTable("Topic", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// ---------- Uploads ----------
export const uploads = pgTable("Upload", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  fileSize: integer("fileSize").notNull(),
  status: uploadStatusEnum("status").default("PENDING").notNull(),
  storagePath: text("storagePath"),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ---------- Questions ----------
export const questions = pgTable(
  "Question",
  {
    id: text("id").primaryKey(),
    content: text("content").notNull(),
    difficulty: difficultyEnum("difficulty").default("MEDIUM").notNull(),
    topicId: text("topicId").references(() => topics.id),
    uploadId: text("uploadId")
      .notNull()
      .references(() => uploads.id, { onDelete: "cascade" }),
    // vector(1536) - embedding
    embedding: vector("embedding", 1536),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [
    index("Question_uploadId_idx").on(t.uploadId),
    index("Question_topicId_idx").on(t.topicId),
  ]
);

// ---------- Flashcards ----------
export const flashcards = pgTable("Flashcard", {
  id: text("id").primaryKey(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  questionId: text("questionId").references(() => questions.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ---------- Chat Sessions ----------
export const chatSessions = pgTable("ChatSession", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

// ---------- Chat Messages ----------
export const chatMessages = pgTable(
  "ChatMessage",
  {
    id: text("id").primaryKey(),
    content: text("content").notNull(),
    role: chatRoleEnum("role").notNull(),
    sessionId: text("sessionId")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [index("ChatMessage_sessionId_idx").on(t.sessionId)]
);

// ---------- Practice Tests ----------
export const practiceTests = pgTable("PracticeTest", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  score: integer("score"),
  totalQuestions: integer("totalQuestions").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const practiceTestItems = pgTable(
  "PracticeTestItem",
  {
    id: text("id").primaryKey(),
    testId: text("testId")
      .notNull()
      .references(() => practiceTests.id, { onDelete: "cascade" }),
    questionId: text("questionId")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    options: text("options").array().notNull(), // String[]
    correctAnswer: text("correctAnswer").notNull(),
    selectedAnswer: text("selectedAnswer"),
    isCorrect: boolean("isCorrect"),
    explanation: text("explanation"),
  },
  (t) => [index("PracticeTestItem_testId_idx").on(t.testId)]
);

// ---------- Relations (optional for query) ----------
export const usersRelations = relations(users, ({ many }) => ({
  uploads: many(uploads),
  chatSessions: many(chatSessions),
  practiceTests: many(practiceTests),
}));

export const uploadsRelations = relations(uploads, ({ one, many }) => ({
  user: one(users, { fields: [uploads.userId], references: [users.id] }),
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  upload: one(uploads, { fields: [questions.uploadId], references: [uploads.id] }),
  topic: one(topics, { fields: [questions.topicId], references: [topics.id] }),
  flashcards: many(flashcards),
}));

export const topicsRelations = relations(topics, ({ many }) => ({
  questions: many(questions),
}));

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  question: one(questions, { fields: [flashcards.questionId], references: [questions.id] }),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, { fields: [chatSessions.userId], references: [users.id] }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, { fields: [chatMessages.sessionId], references: [chatSessions.id] }),
}));

export const practiceTestsRelations = relations(practiceTests, ({ one, many }) => ({
  user: one(users, { fields: [practiceTests.userId], references: [users.id] }),
  items: many(practiceTestItems),
}));

export const practiceTestItemsRelations = relations(practiceTestItems, ({ one }) => ({
  test: one(practiceTests, { fields: [practiceTestItems.testId], references: [practiceTests.id] }),
  question: one(questions, { fields: [practiceTestItems.questionId], references: [questions.id] }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Upload = typeof uploads.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type Flashcard = typeof flashcards.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type PracticeTest = typeof practiceTests.$inferSelect;
export type PracticeTestItem = typeof practiceTestItems.$inferSelect;
