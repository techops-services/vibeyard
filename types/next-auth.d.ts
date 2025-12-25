import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  /**
   * Extended session interface with Vibeyard-specific user properties
   */
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      githubId?: string | null
      githubUsername?: string | null
    }
  }

  /**
   * Extended user interface
   */
  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    githubId?: string | null
    githubUsername?: string | null
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extended JWT interface
   */
  interface JWT {
    id: string
    githubId?: string | null
    githubUsername?: string | null
  }
}
