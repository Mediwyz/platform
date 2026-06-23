import Link from 'next/link'
import {
  FaFacebookF, FaLinkedinIn, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaGooglePlay, FaApple,
} from 'react-icons/fa'

const LINK_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'For patients',
    links: [
      { label: 'Find a doctor', href: '/search/doctors' },
      { label: 'Find services', href: '/search/services' },
      { label: 'Health Shop', href: '/search/health-shop' },
      { label: 'Organisations', href: '/search/organizations' },
      { label: 'Community feed', href: '/community' },
    ],
  },
  {
    title: 'For providers',
    links: [
      { label: 'Join as a provider', href: '/signup?type=provider' },
      { label: 'Manage services', href: '/signup?type=provider' },
      { label: 'Workflows', href: '/signup?type=provider' },
      { label: 'Company partners', href: '/search/company' },
      { label: 'Insurance', href: '/search/insurance' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Get started', href: '/signup' },
      { label: 'Sign in', href: '/login' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Medical disclaimer', href: '/medical-disclaimer' },
    ],
  },
]

const Footer: React.FC = () => (
  <footer role="contentinfo" className="bg-[#001E40] text-faint">
    {/* Thin teal accent line */}
    <div className="h-1 bg-gradient-to-r from-[#0C6780] via-[#9AE1FF] to-[#0C6780]" />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Brand + contact + app badges */}
        <div className="col-span-2 lg:col-span-4">
          <span className="text-white font-bold text-2xl tracking-tight">MediWyz</span>
          <p className="mt-3 text-sm leading-relaxed text-faint max-w-xs">
            One secure platform for every kind of care - book providers, consult by video or audio, order medicines and manage your health across Africa, Mauritius &amp; India.
          </p>

          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex items-center gap-2"><FaMapMarkerAlt className="text-[#9AE1FF] text-xs" /> Moka, Mauritius</li>
            <li><a href="tel:+23058176189" className="flex items-center gap-2 hover:text-white transition"><FaPhone className="text-[#9AE1FF] text-xs" /> +230 5817 6189</a></li>
            <li><a href="mailto:info@mediwyz.com" className="flex items-center gap-2 hover:text-white transition"><FaEnvelope className="text-[#9AE1FF] text-xs" /> info@mediwyz.com</a></li>
          </ul>

          {/* App download badges */}
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/MediWyz-v3.0.0-debug.apk" className="inline-flex items-center gap-2 rounded-lg bg-white/10 border border-white/15 px-3 py-2 hover:bg-white/20 transition" aria-label="Get it on Google Play">
              <FaGooglePlay className="text-base text-white" />
              <span className="flex flex-col leading-none">
                <span className="text-[8px] uppercase tracking-wide text-faint">Get it on</span>
                <span className="text-xs font-bold text-white">Google Play</span>
              </span>
            </a>
            <a href="#" className="inline-flex items-center gap-2 rounded-lg bg-white/10 border border-white/15 px-3 py-2 hover:bg-white/20 transition" aria-label="App Store (coming soon)">
              <FaApple className="text-base text-white" />
              <span className="flex flex-col leading-none">
                <span className="text-[8px] uppercase tracking-wide text-faint">Coming soon</span>
                <span className="text-xs font-bold text-white">App Store</span>
              </span>
            </a>
          </div>
        </div>

        {/* Link columns */}
        {LINK_COLUMNS.map(col => (
          <div key={col.title} className="lg:col-span-2">
            <h4 className="text-white font-semibold text-sm mb-3.5">{col.title}</h4>
            <ul className="space-y-2.5 text-sm">
              {col.links.map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-white transition">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Newsletter / social */}
        <div className="col-span-2 lg:col-span-2">
          <h4 className="text-white font-semibold text-sm mb-3.5">Stay connected</h4>
          <p className="text-sm text-faint mb-4">Follow us for health tips and product updates.</p>
          <div className="flex items-center gap-2.5">
            <a href="https://www.facebook.com/profile.php?id=61579689551043" aria-label="Facebook"
               className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition text-[#9AE1FF]">
              <FaFacebookF className="text-sm" />
            </a>
            <a href="https://www.linkedin.com/company/mediwyz" aria-label="LinkedIn"
               className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition text-[#9AE1FF]">
              <FaLinkedinIn className="text-sm" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom legal bar */}
      <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-soft">
        <p>© {new Date().getFullYear()} MediWyz. All rights reserved.</p>
        <p className="text-center sm:text-right max-w-2xl">
          MediWyz connects users with licensed providers and does not provide medical care directly. In an emergency, call your local emergency services.
        </p>
      </div>
    </div>
  </footer>
)

export default Footer
