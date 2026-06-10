'use client'

const NAV_ITEMS = [
  { label: 'Quick Start',  href: '#quick-start'  },
  { label: 'The Platform', href: '#features'      },
  { label: 'Automations',  href: '#automations'   },
  { label: 'FAQ',          href: '#faq'           },
  { label: 'Security',     href: '#security'      },
]

export default function HelpQuickNav() {
  return (
    <div className="flex flex-wrap gap-2">
      {NAV_ITEMS.map(item => (
        <a
          key={item.label}
          href={item.href}
          className="transition-all help-nav-pill"
          style={{
            padding: '6px 14px',
            borderRadius: 99,
            fontSize: 12,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            textDecoration: 'none',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.color = '#fff'
            el.style.background = 'rgba(0,85,255,0.2)'
            el.style.borderColor = 'rgba(0,85,255,0.4)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.color = 'rgba(255,255,255,0.5)'
            el.style.background = 'rgba(255,255,255,0.05)'
            el.style.borderColor = 'rgba(255,255,255,0.1)'
          }}
        >
          {item.label}
        </a>
      ))}
    </div>
  )
}
