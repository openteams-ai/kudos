import NextAuth from "next-auth";
import Slack from "next-auth/providers/slack";
import { linkSlackUser } from "@kudos/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Slack({
      clientId: process.env.AUTH_SLACK_ID,
      clientSecret: process.env.AUTH_SLACK_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, profile }) {
      const slackUserId = (profile as Record<string, unknown>)?.["https://slack.com/user_id"] as string | undefined;
      if (!slackUserId) return false; // must link on the Slack user id, not `sub`
      const linked = await linkSlackUser({
        slackUserId,
        name: user.name ?? "teammate",
        email: user.email ?? null,
        avatarUrl: user.image ?? null,
      });
      (user as { dbId?: string }).dbId = linked.id;
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.userId = (user as { dbId?: string }).dbId;
      return token;
    },
    async session({ session, token }) {
      if (token.userId && session.user) {
        (session.user as { id?: string }).id = token.userId as string;
      }
      return session;
    },
  },
});
