export function YardFooter() {
  return (
    <div className="border-t border-[--yard-border] p-4 yard-meta text-xs text-center">
      <p>
        <span className="mono">vibeyard</span> • the junkyard for vibecode
        with potential •{' '}
        <a
          href="/feed.xml"
          className="hover:text-[--yard-orange] hover:underline"
          title="RSS Feed"
        >
          rss
        </a>
      </p>
    </div>
  )
}
