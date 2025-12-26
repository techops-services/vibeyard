export default function WorkbenchLoading() {
  return (
    <main className="flex-1 max-w-6xl w-full mx-auto p-4">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-96 mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-[--yard-border] p-4">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
