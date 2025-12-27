'use client'

interface DeployedBadgeProps {
  url: string
}

export function DeployedBadge({ url }: DeployedBadgeProps) {
  // Extract display domain from URL
  const displayUrl = (() => {
    try {
      const parsed = new URL(url)
      return parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '')
    } catch {
      return url
    }
  })()

  return (
    <div className="deployed-badge group">
      <style jsx>{`
        .deployed-badge {
          --glow-color: #22c55e;
          --glow-color-dim: #16a34a;
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px 8px 12px;
          background: linear-gradient(
            135deg,
            rgba(34, 197, 94, 0.08) 0%,
            rgba(34, 197, 94, 0.03) 100%
          );
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .deployed-badge::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 3px;
          background: linear-gradient(
            135deg,
            rgba(34, 197, 94, 0.2) 0%,
            transparent 50%,
            rgba(34, 197, 94, 0.1) 100%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
        }

        .deployed-badge:hover::before {
          opacity: 1;
        }

        .deployed-badge:hover {
          border-color: rgba(34, 197, 94, 0.5);
          box-shadow:
            0 0 20px rgba(34, 197, 94, 0.15),
            inset 0 0 20px rgba(34, 197, 94, 0.03);
        }

        .live-indicator {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: var(--glow-color);
          border-radius: 50%;
          box-shadow:
            0 0 4px var(--glow-color),
            0 0 8px var(--glow-color),
            0 0 12px rgba(34, 197, 94, 0.4);
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .live-ring {
          position: absolute;
          width: 18px;
          height: 18px;
          border: 1px solid var(--glow-color);
          border-radius: 50%;
          opacity: 0;
          animation: ring-expand 2s ease-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
            box-shadow:
              0 0 4px var(--glow-color),
              0 0 8px var(--glow-color),
              0 0 12px rgba(34, 197, 94, 0.4);
          }
          50% {
            opacity: 0.7;
            box-shadow:
              0 0 2px var(--glow-color),
              0 0 4px var(--glow-color),
              0 0 6px rgba(34, 197, 94, 0.2);
          }
        }

        @keyframes ring-expand {
          0% {
            transform: scale(0.5);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .live-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--glow-color);
          text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
        }

        .url-link {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #525252;
          text-decoration: none;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .url-link:hover {
          color: var(--glow-color);
        }

        .url-link::after {
          content: '↗';
          font-size: 10px;
          opacity: 0;
          transform: translate(-4px, 4px);
          transition: all 0.2s ease;
        }

        .deployed-badge:hover .url-link::after {
          opacity: 0.7;
          transform: translate(0, 0);
        }

        .divider {
          width: 1px;
          height: 16px;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(34, 197, 94, 0.3),
            transparent
          );
        }
      `}</style>

      <div className="live-indicator">
        <div className="live-ring" />
        <div className="live-dot" />
      </div>

      <span className="live-label">Live</span>

      <div className="divider" />

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="url-link"
        title={`Visit ${url}`}
      >
        {displayUrl}
      </a>
    </div>
  )
}
