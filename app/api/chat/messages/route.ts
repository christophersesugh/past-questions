// @ts-nocheck

import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/auth";
import { chatMessages, chatSessions, db, withRetry } from "@/lib/db";

export async function GET(request: NextRequest) {
	try {
		const { userId, error } = await requireUser();
		if (error) return error;

		const { searchParams } = new URL(request.url);
		const sessionId = searchParams.get("sessionId");

		if (!sessionId) {
			return NextResponse.json(
				{ error: "sessionId required" },
				{ status: 400 },
			);
		}

		const [session] = await withRetry(() =>
			db
				.select()
				.from(chatSessions)
				.where(
					and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)),
				)
				.limit(1),
		);

		if (!session) {
			return NextResponse.json({ error: "Session not found" }, { status: 404 });
		}

		const messages = await withRetry(() =>
			db
				.select()
				.from(chatMessages)
				.where(eq(chatMessages.sessionId, sessionId))
				.orderBy(chatMessages.createdAt),
		);

		const formatted = messages.map((m) => ({
			id: m.id,
			role: m.role,
			content: m.content,
			// biome-ignore lint/suspicious/noExplicitAny: no exp.
			timestamp: new Date(m.createdAt as any).toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			}),
			createdAt: m.createdAt,
		}));

		return NextResponse.json({
			session: { id: session.id, title: session.title },
			messages: formatted,
		});
	} catch (err) {
		return apiError(err, 500, "Failed to fetch messages");
	}
}
