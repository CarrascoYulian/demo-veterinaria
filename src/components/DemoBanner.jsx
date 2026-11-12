import { useState } from 'react'
import { ArrowRight, BellRing, CalendarCheck, CheckCircle2, Mail, MessageCircle, MessagesSquare } from 'lucide-react'
import { Modal } from './ui.jsx'
import { useStore } from '../store.jsx'

const STEPS = [
  { icon: CalendarCheck, title: 'El cliente reserva', text: 'Elige servicio, fecha y hora desde el celular. La cita entra directo a la agenda de la clínica.' },
  { icon: CheckCircle2, title: 'Confirmación inmediata', text: 'En el mismo momento recibe un mensaje con el resumen y el código de su cita.' },
  { icon: BellRing, title: 'Recordatorio automático', text: 'El sistema envía un recordatorio antes de la cita (por ejemplo, 24 horas antes), sin que nadie tenga que acordarse.' },
  { icon: MessagesSquare, title: 'El cliente responde', text: 'Por WhatsApp responde 1 para confirmar o 2 para cancelar. La agenda se actualiza y el hueco queda libre si cancela.' },
]

export default function DemoBanner() {
  const { config } = useStore()
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="flex items-center justify-center gap-2 bg-ink px-4 py-2 text-center text-xs text-white/70">
        <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white ring-1 ring-inset ring-white/15">DEMO</span>
        <span className="hidden sm:inline">Datos de prueba ·</span>
        <button type="button" className="group inline-flex items-center gap-1 font-medium text-white hover:text-white/80" onClick={() => setOpen(true)}>
          Ver cómo se conecta a WhatsApp o email
          <ArrowRight className="h-3 w-3 transition-transform duration-200 ease-out group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Cómo funcionan los recordatorios" subtitle="Lo que pasa después de cada reserva" icon={BellRing} size="lg">
        <ol className="relative space-y-5 before:absolute before:bottom-5 before:left-5 before:top-5 before:w-px before:bg-slate-200">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="relative flex gap-4">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-ring">
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <div className="pt-1">
                <p className="font-semibold">
                  <span className="tabular mr-1.5 text-slate-400">{i + 1}.</span>
                  {title}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {[
            { key: 'whatsapp', icon: MessageCircle, title: 'WhatsApp', text: 'API oficial de WhatsApp Business (Meta), con número exclusivo del negocio y plantillas aprobadas. Es el canal que más ven los clientes.' },
            { key: 'email', icon: Mail, title: 'Correo electrónico', text: 'Proveedor de correo transaccional, con remitente verificado en el dominio de la clínica. Más simple, sirve como respaldo.' },
          ].map(({ key, icon: Icon, title, text }) => {
            const active = config.notificationChannel === key
            return (
              <div key={key} className={`rounded-2xl p-4 ${active ? 'bg-primary/[0.05] ring-2 ring-primary' : 'ring-1 ring-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 font-semibold">
                    <Icon className="h-4 w-4 text-slate-500" aria-hidden="true" /> {title}
                  </p>
                  {active && <span className="chip bg-primary text-onprimary ring-transparent">En uso</span>}
                </div>
                <p className="mt-1.5 text-sm text-slate-600">{text}</p>
              </div>
            )
          })}
        </div>
        <p className="mt-5 text-xs text-slate-500">En esta demo los mensajes se simulan dentro de la página: no se envía nada real. El canal se elige en “Personaliza tu demo”.</p>
      </Modal>
    </>
  )
}
