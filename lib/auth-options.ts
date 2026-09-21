import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// In production (HTTPS) NextAuth prefixes cookies with __Secure- by default.
// We must match that prefix when overriding cookie options, otherwise the
// middleware's getToken() looks for __Secure-next-auth.session-token but finds
// next-auth.session-token (or vice versa) and treats the session as missing.
const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://') ?? process.env.NODE_ENV === 'production';
const cookiePrefix = useSecureCookies ? '__Secure-' : '';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (credentials?.email && credentials?.password) {
          return {
            id: 'rep-1',
            email: credentials.email,
            name: 'Sales Representative',
            role: 'rep',
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role: string }).role || 'rep';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = (token.role as string) || 'rep';
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  // SameSite=None lets cookies work inside cross-origin iframes (Showpad embedding this app).
  // Cookie names must match NextAuth's environment-aware defaults (__Secure- prefix on HTTPS).
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'none' as const,
        path: '/',
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: {
        sameSite: 'none' as const,
        path: '/',
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: `${cookiePrefix}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'none' as const,
        path: '/',
        secure: useSecureCookies,
      },
    },
  },
};
