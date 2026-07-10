import type { NextAuthConfig } from "next-auth";

export default {
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDashboardRoute =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/uploads") ||
        nextUrl.pathname.startsWith("/chat") ||
        nextUrl.pathname.startsWith("/flashcards") ||
        nextUrl.pathname.startsWith("/practice-tests") ||
        nextUrl.pathname.startsWith("/recommendations");

      if (isDashboardRoute) {
        if (isLoggedIn) return true;
        return false; // Redirect to sign in page
      } else if (isLoggedIn && nextUrl.pathname.startsWith("/auth")) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [], // Declared in main auth.ts to avoid edge runtime database issues
} satisfies NextAuthConfig;
