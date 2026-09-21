import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware() {},
  {
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      // Accept any valid session token — role is always 'rep' for this demo app
      authorized: ({ token }) => !!token,
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
