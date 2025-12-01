import Link from "next/link"
import { Info, Shield, ClipboardList, ExternalLink } from "lucide-react"

export default function Footer() {
  const year = new Date().getFullYear()

  const iconClass = "w-4 h-4 inline-block mr-2 align-text-bottom"

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-600">
          <div className="text-center md:text-left">
            © {year} WatSearch
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-4">

            <Link href="/privacy" className="hover:underline flex items-center">
              <Shield className={iconClass} aria-hidden />
              <span>Privacy</span>
            </Link>

            <a
              href="https://github.com/Quackers2446/WatSearch"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center"
            >
              <ExternalLink className={iconClass} aria-hidden />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
