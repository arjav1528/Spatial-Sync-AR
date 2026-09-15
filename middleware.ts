import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Custom middleware logic
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token && token.role === "rep",
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

// ONLY protect Sales Rep routes (/admin, /dashboard).
// Public viewer routes (/session/[id], /api/session, /api/analytics) are completely unauthenticated.
export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
