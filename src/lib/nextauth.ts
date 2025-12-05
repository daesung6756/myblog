import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from './prisma'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any),
  session: {
    strategy: 'database',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const email = credentials?.email
        const password = credentials?.password
        if (!email || !password) return null

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          console.error('[NextAuth] Supabase signIn error:', error)
          return null
        }

        const user = data?.user
        if (!user) return null

        // Return user object for next-auth (id required)
        return {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || null,
          // Keep tokens in account/session via callbacks
          _supabaseSession: data.session ?? null,
        } as any
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // allow all signins for now
      return true
    },
    async session({ session, user, token }) {
      // expose user id and role on session.user
      session.user = session.user || {}
      // Attach database user id
      session.user.id = user?.id ?? token?.sub
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default authOptions
