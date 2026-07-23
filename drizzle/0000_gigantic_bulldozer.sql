CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."ChatRole" AS ENUM('USER', 'ASSISTANT');--> statement-breakpoint
CREATE TYPE "public"."Difficulty" AS ENUM('EASY', 'MEDIUM', 'HARD');--> statement-breakpoint
CREATE TYPE "public"."UploadStatus" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR');--> statement-breakpoint
CREATE TABLE "ChatMessage" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"role" "ChatRole" NOT NULL,
	"sessionId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ChatSession" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Flashcard" (
	"id" text PRIMARY KEY NOT NULL,
	"front" text NOT NULL,
	"back" text NOT NULL,
	"questionId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PracticeTestItem" (
	"id" text PRIMARY KEY NOT NULL,
	"testId" text NOT NULL,
	"questionId" text NOT NULL,
	"options" text[] NOT NULL,
	"correctAnswer" text NOT NULL,
	"selectedAnswer" text,
	"isCorrect" boolean,
	"explanation" text
);
--> statement-breakpoint
CREATE TABLE "PracticeTest" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"score" integer,
	"totalQuestions" integer NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Question" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"difficulty" "Difficulty" DEFAULT 'MEDIUM' NOT NULL,
	"topicId" text,
	"uploadId" text NOT NULL,
	"embedding" vector(1536),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Topic" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "Topic_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "Upload" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"fileSize" integer NOT NULL,
	"status" "UploadStatus" DEFAULT 'PENDING' NOT NULL,
	"storagePath" text,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_ChatSession_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."ChatSession"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_questionId_Question_id_fk" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PracticeTestItem" ADD CONSTRAINT "PracticeTestItem_testId_PracticeTest_id_fk" FOREIGN KEY ("testId") REFERENCES "public"."PracticeTest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PracticeTestItem" ADD CONSTRAINT "PracticeTestItem_questionId_Question_id_fk" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PracticeTest" ADD CONSTRAINT "PracticeTest_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Question" ADD CONSTRAINT "Question_topicId_Topic_id_fk" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Question" ADD CONSTRAINT "Question_uploadId_Upload_id_fk" FOREIGN KEY ("uploadId") REFERENCES "public"."Upload"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "PracticeTestItem_testId_idx" ON "PracticeTestItem" USING btree ("testId");--> statement-breakpoint
CREATE INDEX "Question_uploadId_idx" ON "Question" USING btree ("uploadId");--> statement-breakpoint
CREATE INDEX "Question_topicId_idx" ON "Question" USING btree ("topicId");