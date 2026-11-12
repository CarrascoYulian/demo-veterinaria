import { useStore } from '../store.jsx'
import { Modal } from './ui.jsx'
import MessageView from './MessageView.jsx'
import { NOTES } from '../lib/notify.js'

/** Visor global de mensajes enviados (simulados). */
export default function MessagePreview() {
  const { preview, setPreview } = useStore()
  const open = !!preview?.length
  const close = () => setPreview(null)
  const channel = preview?.[0]?.channel
  return (
    <Modal
      open={open}
      onClose={close}
      title={open && preview.length > 1 ? `${preview.length} mensajes enviados` : 'Mensaje enviado'}
      footer={
        <button type="button" className="btn-primary" onClick={close}>
          Entendido
        </button>
      }
    >
      {open && (
        <div className="space-y-5">
          {preview.map((m) => (
            <div key={m.id}>
              {preview.length > 1 && <p className="mb-1.5 text-xs font-semibold text-slate-500">Cita {m.code}</p>}
              <MessageView msg={m} showNote={false} />
            </div>
          ))}
          <p className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600">{NOTES[channel]}</p>
        </div>
      )}
    </Modal>
  )
}
