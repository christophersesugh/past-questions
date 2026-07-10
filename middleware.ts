import NextAuth from "next-auth";
import authConfig from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Guard all paths except static files, favicons, public assets, and API routes
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
