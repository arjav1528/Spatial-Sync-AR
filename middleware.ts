import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware() {
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

// ONLY protect Sales Rep routes (/rep, /admin, /dashboard).
// Public viewer routes (/session/[id], /api/session, /api/analytics) are completely unauthenticated.
export const config = {
  matcher: ["/rep/:path*", "/admin/:path*", "/dashboard/:path*"],
};
