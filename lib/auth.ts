import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GitHubProvider from 'next-auth/providers/github'
import { prisma } from './prisma'

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set in environment variables')
}

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  throw new Error(
    'GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set in environment variables'
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'read:user user:email repo',
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

        // Fetch GitHub data from the database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            githubId: true,
            githubUsername: true,
            githubAccessToken: true,
          },
        })

        if (dbUser) {
          session.user.githubId = dbUser.githubId
          session.user.githubUsername = dbUser.githubUsername
        }
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (!account || !profile) {
        return false
      }

      // GitHub provider
      if (account.provider === 'github' && user.email) {
        try {
          // Update user with GitHub information using email as identifier
          // This works for both new and existing users
          await prisma.user.update({
            where: { email: user.email },
            data: {
              githubId: account.providerAccountId,
              githubUsername: (profile as any).login,
              githubAccessToken: account.access_token,
            },
          })
        } catch (error) {
          console.error('Error updating user GitHub data:', error)
          // Don't block sign-in if GitHub data update fails
        }
      }

      return true
    },
  },
  debug: process.env.NODE_ENV === 'development',
})
