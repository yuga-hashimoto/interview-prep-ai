import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email) return null
        
        // Mock login: Create/Get user by email without password
        const email = credentials.email as string
        
        // Check if user exists
        let user = await prisma.user.findUnique({ where: { email } })
        
        if (!user) {
             // Create new user
             user = await prisma.user.create({
                 data: { email }
             })
        }
        
        return user
      },
    }),
  ],
  session: {
      strategy: "jwt" 
  },
  trustHost: true,
  callbacks: {
      async session({ session, token }) {
          if (token.sub && session.user) {
              session.user.id = token.sub
          }
          return session
      }
  }
})
