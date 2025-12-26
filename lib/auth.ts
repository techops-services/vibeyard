import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GitHubProvider from 'next-auth/providers/github'
import { prisma } from './prisma'

// Provide fallback values during build time (Next.js static analysis)
// At runtime, real values must be provided via environment variables
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'build-time-placeholder'
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'build-time-placeholder'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET || 'build-time-placeholder-secret',
  trustHost: true, // Required when behind proxy (Cloudflare/Traefik)
  providers: [
    GitHubProvider({
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'read:user user:email public_repo',
        },
      },
    }),
  ],
  session: {
    strategy: 'database',
  },
  callbacks: {
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id

        // Fetch GitHub data from User table
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            githubId: true,
            githubUsername: true,
          },
        })

        if (dbUser) {
          session.user.githubId = dbUser.githubId
          session.user.githubUsername = dbUser.githubUsername
        }
      }
      return session
    },
  },
  events: {
    // Use signIn event which fires AFTER the user/account is created
    async signIn({ user, account, profile }) {
      if (account?.provider === 'github' && profile) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              githubId: account.providerAccountId,
              githubUsername: (profile as any).login,
              githubAccessToken: account.access_token,
            },
          })
        } catch (error) {
          console.error('Error updating user GitHub data:', error)
        }
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
})
