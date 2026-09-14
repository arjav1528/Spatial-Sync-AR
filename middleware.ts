import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Custom middleware logic if needed
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/session/:path*"],
};
