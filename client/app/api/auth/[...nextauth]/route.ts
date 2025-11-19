import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const EXPRESS_BASE_URL = process.env.EXPRESS_BASE_URL || "http://localhost:5000";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "admin@adminflow.uy" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const response = await fetch(`${EXPRESS_BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });
        if (!response.ok) {
          return null;
        }
        const data = await response.json();
        return {
          id: data.userId || "guest",
          email: credentials.email,
          token: data.token,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.token) {
        token.accessToken = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...(session.user ?? {}),
        accessToken: token.accessToken as string | undefined,
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "dev_adminflow_secret",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
