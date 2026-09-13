import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// Microsoft Entra ID ("Sign in with Microsoft") is the intended long-term
// auth method — see AUTH_MICROSOFT_ENTRA_ID_* env vars. It only activates
// once the school's IT admin provides an app registration; until then the
// credentials provider below lets the app be exercised end-to-end in dev.
const microsoftConfigured =
  !!process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
  !!process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
  !!process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER;

type MsGraphToken = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number; // epoch seconds
};

async function refreshMicrosoftAccessToken(token: MsGraphToken): Promise<MsGraphToken> {
  if (!token.refreshToken) return token;
  try {
    const res = await fetch(
      `${process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
          client_secret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken,
          scope: "openid profile email offline_access User.Read Calendars.Read",
        }),
      }
    );
    if (!res.ok) return token;
    const refreshed = await res.json();
    return {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + refreshed.expires_in,
    };
  } catch {
    return token;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(microsoftConfigured
      ? [
          MicrosoftEntraID({
            clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
            clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
            issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
            // Calendars.Read + offline_access let the calendar page pull
            // each staff member's own Outlook events — see
            // src/lib/msGraphCalendar.ts.
            authorization: {
              params: {
                scope: "openid profile email offline_access User.Read Calendars.Read",
              },
            },
          }),
        ]
      : []),
    // Dev-only stand-in for staff who haven't been provisioned with
    // Microsoft sign-in yet. Remove once Entra ID is fully rolled out.
    Credentials({
      id: "dev-credentials",
      name: "Dev sign-in (temporary)",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        if (!email) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.active) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role } as never;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      // Only the Microsoft provider carries a Graph access token.
      if (account?.provider === "microsoft-entra-id") {
        token.msGraph = {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        } satisfies MsGraphToken;
      } else if (token.msGraph) {
        const graph = token.msGraph as MsGraphToken;
        if (graph.expiresAt && graph.expiresAt < Math.floor(Date.now() / 1000) + 60) {
          token.msGraph = await refreshMicrosoftAccessToken(graph);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = token.id as string;
        (session.user as { id?: string; role?: string }).role = token.role as string;
      }
      const graph = token.msGraph as MsGraphToken | undefined;
      if (graph?.accessToken) {
        (session as { msGraphAccessToken?: string }).msGraphAccessToken = graph.accessToken;
      }
      return session;
    },
  },
});

export const isMicrosoftAuthConfigured = microsoftConfigured;
