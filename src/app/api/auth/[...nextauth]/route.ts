import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
// import { connectDB } from "@/lib/db";
// import User from "@/models/User";
import { connectDB } from "../../../../lib/db";
import User from "../../../../models/User";
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectDB();
          const userExists = await User.findOne({ email: user.email });
          if (!userExists) {
            await User.create({
              name: user.name,
              email: user.email,
            });
          }
          return true; 
        } catch (error) {
          console.log("Error checking user: ", error);
          return false; 
        }
      }
      return true;
    },
    async session({ session }) {
      return session;
    },
  },
});

export { handler as GET, handler as POST };