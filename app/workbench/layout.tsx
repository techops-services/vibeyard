import { YardHeader } from '@/app/components/YardHeader'

export default async function WorkbenchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <YardHeader />
      {children}
    </div>
  )
}
