import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { credentialsSchema } from '@/lib/validation';
import { verifyUser } from '@/server/repository';

/**
 * Auth.js (NextAuth v5) with an email + bcrypt-password credentials provider
 * and stateless JWT sessions. Chosen over Clerk so the app runs end-to-end
 * (dev, CI, self-hosted) with zero third-party accounts; the session shape
 * below is the only integration surface, so swapping providers later doesn't
 * touch the data layer.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/sign-in' },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await verifyUser(parsed.data.email, parsed.data.password);
        return user ? { id: user.id, email: user.email } : null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
