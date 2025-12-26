import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { YardHeader } from '@/app/components/YardHeader'

export default async function WorkbenchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/api/auth/signin')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <YardHeader />
      {children}
    </div>
  )
}
