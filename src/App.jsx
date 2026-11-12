import { useEffect, useState } from 'react'
import { Palette } from 'lucide-react'
import Booking from './client/Booking.jsx'
import Admin from './admin/Admin.jsx'
import DemoBanner from './components/DemoBanner.jsx'
import CustomizePanel from './components/CustomizePanel.jsx'
import MessagePreview from './components/MessagePreview.jsx'
import { useStore } from './store.jsx'

function getRoute() {
  const hash = window.location.hash
  if (hash.startsWith('#/admin')) return 'admin'
  if (!hash && window.location.pathname.replace(/\/$/, '').endsWith('/admin')) return 'admin'
  return 'client'
}

export default function App() {
  const [route, setRoute] = useState(getRoute)
  const { customizeOpen, setCustomizeOpen } = useStore()

  useEffect(() => {
    const onHash = () => {
      setRoute(getRoute())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div className="min-h-screen">
      <DemoBanner />
      {route === 'admin' ? <Admin /> : <Booking />}

      <button
        type="button"
        onClick={() => setCustomizeOpen(true)}
        className="btn-dark fixed bottom-4 right-4 z-30 h-11 rounded-full pl-3.5 pr-4 shadow-pop sm:bottom-6 sm:right-6"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
          <Palette className="h-3.5 w-3.5 text-white" strokeWidth={2.25} aria-hidden="true" />
        </span>
        Personaliza tu demo
      </button>

      <CustomizePanel open={customizeOpen} onClose={() => setCustomizeOpen(false)} />
      <MessagePreview />
    </div>
  )
}
