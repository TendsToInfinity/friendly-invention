import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      /** Database user id — the authorization key for every repository call. */
      id: string;
    } & DefaultSession['user'];
  }
}
