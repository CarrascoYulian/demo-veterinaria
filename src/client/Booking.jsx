import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  Bell,
  Bird,
  CalendarCheck,
  CalendarPlus,
  Cat,
  Check,
  ChevronRight,
  Clock,
  Dog,
  HeartPulse,
  Mail,
  MapPin,
  MessageCircle,
  PawPrint,
  PencilLine,
  Phone,
  Pill,
  Rabbit,
  ShieldCheck,
  Siren,
  Stethoscope,
  Sun,
  Sunset,
  Syringe,
  UserRound,
  Zap,
} from 'lucide-react'
import { useStore, useLookups } from '../store.jsx'
import { Avatar, BrandText, Field, Logo } from '../components/ui.jsx'
import MessageView from '../components/MessageView.jsx'
import { professionalsForService, slotsForPros } from '../lib/slots.js'
import { addDays, formatDateTitle, formatTime, todayISO, toMin, weekday } from '../lib/time.js'
import { SPECIES_OPTIONS, buildIcs, isEmail, normalizePhone, speciesLabel } from '../lib/appointments.js'
import { isPlaceholder } from '../lib/config.js'

const STEP_LABELS = ['Servicio', 'Fecha', 'Horario', 'Datos']
const EMPTY_FORM = { ownerName: '', phone: '', email: '', petName: '', species: 'perro', breed: '', reason: '' }
const SERVICE_ICONS = { consulta: Stethoscope, vacunacion: Syringe, desparasitacion: Pill, bano: Bath, cirugia: HeartPulse, emergencia: Siren }
const SPECIES_ICONS = { perro: Dog, gato: Cat, ave: Bird, conejo: Rabbit, otro: PawPrint }
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export const ServiceIcon = ({ id, className }) => {
  const Icon = SERVICE_ICONS[id] || PawPrint
  return <Icon className={className} aria-hidden="true" />
}

export default function Booking() {
  const { config, data, createAppointment } = useStore()
  const { proName } = useLookups()
  const [step, setStep] = useState(1)
  const [serviceId, setServiceId] = useState(null)
  const [proChoice, setProChoice] = useState('any')
  const [date, setDate] = useState(null)
  const [slot, setSlot] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(null)
  const bookingRef = useRef(null)
  const firstRender = useRef(true)

  const service = config.services.find((s) => s.id === serviceId)
  const eligible = professionalsForService(config, service)
  const proIds = proChoice === 'any' ? eligible.map((p) => p.id) : [proChoice]
  const today = todayISO(config.timezone)

  const days = useMemo(() => Array.from({ length: config.bookingDaysAhead }, (_, i) => addDays(today, i)), [today, config.bookingDaysAhead])

  const availability = useMemo(() => {
    if (!service) return {}
    const out = {}
    for (const d of days) out[d] = slotsForPros({ config, data, proIds, date: d, duration: service.durationMin })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, days, config, data, proIds.join(',')])

  // Próximo horario libre (el gancho del encabezado)
  const nextAvailable = useMemo(() => {
    const svc = config.services.find((s) => professionalsForService(config, s).length)
    if (!svc) return null
    const ids = professionalsForService(config, svc).map((p) => p.id)
    for (const d of days) {
      const s = slotsForPros({ config, data, proIds: ids, date: d, duration: svc.durationMin })
      if (s.length) return { service: svc, date: d, slot: s[0] }
    }
    return null
  }, [config, data, days])

  const daySlots = (date && availability[date]) || []

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const top = bookingRef.current?.getBoundingClientRect().top ?? 0
    if (top < -40 || top > window.innerHeight * 0.5) bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [step, done])

  useEffect(() => {
    if (!done && step === 4 && slot && !daySlots.some((s) => s.time === slot.time)) {
      setSlot(null)
      setStep(3)
    }
  }, [daySlots, slot, step, done])

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }))
  }

  function chooseService(id) {
    setServiceId(id)
    setProChoice('any')
    setDate(null)
    setSlot(null)
    setStep(2)
  }

  function bookNext() {
    if (!nextAvailable) return
    setServiceId(nextAvailable.service.id)
    setProChoice('any')
    setDate(nextAvailable.date)
    setSlot(nextAvailable.slot)
    setDone(null)
    setStep(4)
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function submit(e) {
    e.preventDefault()
    const errs = {}
    if (form.ownerName.trim().length < 3) errs.ownerName = 'Escriba su nombre completo.'
    const phone = normalizePhone(form.phone)
    if (!phone) errs.phone = 'Use un número dominicano válido, por ejemplo 809-555-1234.'
    if (form.email.trim() && !isEmail(form.email)) errs.email = 'Revise el correo, parece incompleto.'
    if (!form.petName.trim()) errs.petName = 'Escriba el nombre de su mascota.'
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.getElementById(`f-${Object.keys(errs)[0]}`)?.focus()
      return
    }
    const result = createAppointment({
      serviceId,
      professionalId: slot.proId,
      date,
      start: slot.time,
      ownerName: form.ownerName.trim(),
      phone,
      email: form.email.trim(),
      petName: form.petName.trim(),
      species: form.species,
      breed: form.breed.trim(),
      petAge: '',
      reason: form.reason.trim(),
    })
    if (result.error) {
      setErrors({ submit: result.error })
      setSlot(null)
      setStep(3)
      return
    }
    setDone(result)
  }

  function restart() {
    setDone(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setServiceId(null)
    setDate(null)
    setSlot(null)
    setStep(1)
  }

  const channel = config.notificationChannel
  const morning = daySlots.filter((s) => toMin(s.time) < 12 * 60)
  const afternoon = daySlots.filter((s) => toMin(s.time) >= 12 * 60)

  return (
    <>
      <Hero nextAvailable={nextAvailable} onBookNext={bookNext} onStart={() => bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />

      <main ref={bookingRef} className="relative z-10 mx-auto -mt-10 max-w-6xl scroll-mt-4 px-4 pb-24 sm:-mt-14 sm:px-6">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="card overflow-hidden" aria-label="Reservar cita">
            {done ? (
              <Success done={done} config={config} proName={proName} onRestart={restart} />
            ) : (
              <>
                <div className="border-b border-slate-100 px-5 pb-5 pt-6 sm:px-8 sm:pt-7">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="text-xl font-semibold sm:text-2xl">Reserve su cita</h2>
                    <span className="tabular text-xs font-medium text-slate-400">Paso {step} de 4</span>
                  </div>
                  <Stepper step={step} onJump={(n) => n < step && setStep(n)} />
                </div>

                <div key={step} className="animate-fade-up px-5 py-6 sm:px-8 sm:py-8">
                  {step > 1 && service && <MobileSummary service={service} date={step > 2 ? date : null} slot={step > 3 ? slot : null} proName={proName} />}

                  {step === 1 && (
                    <StepSection title="¿Qué necesita su mascota?" subtitle="Elija un servicio para ver los horarios libres.">
                      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Servicio">
                        {config.services.map((s, i) => {
                          const available = professionalsForService(config, s).length > 0
                          return (
                            <button
                              key={s.id}
                              type="button"
                              disabled={!available}
                              onClick={() => chooseService(s.id)}
                              aria-checked={serviceId === s.id}
                              role="radio"
                              style={{ animationDelay: `${i * 40}ms` }}
                              className="option group flex animate-fade-up items-center gap-4 p-4 disabled:opacity-50"
                            >
                              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <ServiceIcon id={s.id} className="h-[22px] w-[22px]" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-semibold">{s.name}</span>
                                <span className="mt-0.5 flex items-center gap-1 text-[13px] text-slate-500">
                                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                  {available ? `${s.durationMin} min` : 'No disponible'}
                                </span>
                              </span>
                              <ChevronRight className="h-5 w-5 text-slate-300 transition-transform duration-200 ease-out group-hover:translate-x-0.5" aria-hidden="true" />
                            </button>
                          )
                        })}
                      </div>
                    </StepSection>
                  )}

                  {step === 2 && service && (
                    <div className="space-y-8">
                      <StepSection title="¿Con quién desea la cita?">
                        <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Profesional">
                          {[{ id: 'any', name: 'El primero disponible', specialty: 'Le asignamos el horario más cercano' }, ...eligible].map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              role="radio"
                              aria-checked={proChoice === p.id}
                              onClick={() => {
                                setProChoice(p.id)
                                setDate(null)
                                setSlot(null)
                              }}
                              className="option flex items-center gap-3 p-3"
                            >
                              {p.id === 'any' ? (
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <Zap className="h-[18px] w-[18px]" aria-hidden="true" />
                                </span>
                              ) : (
                                <Avatar name={p.name} />
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold">{p.name}</span>
                                <span className="block truncate text-xs text-slate-500">{p.specialty}</span>
                              </span>
                              <RadioDot checked={proChoice === p.id} />
                            </button>
                          ))}
                        </div>
                      </StepSection>

                      <StepSection title="Elija el día" subtitle="Los días con punto tienen horarios libres.">
                        <MonthGrid
                          days={days}
                          today={today}
                          selected={date}
                          availability={availability}
                          onPick={(d) => {
                            setDate(d)
                            setSlot(null)
                            setStep(3)
                          }}
                        />
                      </StepSection>
                      <BackButton onClick={() => setStep(1)} label="Cambiar servicio" />
                    </div>
                  )}

                  {step === 3 && service && date && (
                    <StepSection title={formatDateTitle(date)} subtitle={`${daySlots.length} horarios libres para ${service.name.toLowerCase()} (${service.durationMin} min)`}>
                      {errors.submit && (
                        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/10" role="alert">
                          {errors.submit}
                        </p>
                      )}
                      {daySlots.length === 0 && <p className="text-slate-600">Ya no quedan horarios este día. Elija otro día.</p>}
                      <div className="space-y-6">
                        {[
                          ['Mañana', Sun, morning],
                          ['Tarde', Sunset, afternoon],
                        ].map(
                          ([label, Icon, list]) =>
                            list.length > 0 && (
                              <div key={label}>
                                <p className="eyebrow mb-2.5 flex items-center gap-1.5">
                                  <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
                                </p>
                                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                                  {list.map((s) => (
                                    <button
                                      key={s.time}
                                      type="button"
                                      aria-pressed={slot?.time === s.time}
                                      onClick={() => {
                                        setSlot(s)
                                        setErrors({})
                                        setStep(4)
                                      }}
                                      className={`option tabular h-11 rounded-xl text-center text-sm font-semibold ${slot?.time === s.time ? 'bg-primary text-onprimary' : ''}`}
                                    >
                                      {formatTime(s.time)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ),
                        )}
                      </div>
                      <div className="mt-8">
                        <BackButton onClick={() => setStep(2)} label="Cambiar día" />
                      </div>
                    </StepSection>
                  )}

                  {step === 4 && service && slot && (
                    <form onSubmit={submit} noValidate className="space-y-8">
                      <StepSection title="Sus datos" subtitle="Solo lo necesario para confirmar su cita.">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Nombre del dueño" htmlFor="f-ownerName" error={errors.ownerName} className="sm:col-span-2">
                            <input id="f-ownerName" className="input" autoComplete="name" value={form.ownerName} onChange={set('ownerName')} placeholder="María Peña" aria-invalid={!!errors.ownerName} />
                          </Field>
                          <Field label={channel === 'whatsapp' ? 'Teléfono (WhatsApp)' : 'Teléfono'} htmlFor="f-phone" error={errors.phone}>
                            <input id="f-phone" className="input tabular" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="809-555-1234" aria-invalid={!!errors.phone} />
                          </Field>
                          <Field label="Correo (opcional)" htmlFor="f-email" error={errors.email}>
                            <input id="f-email" className="input" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="nombre@correo.com" aria-invalid={!!errors.email} />
                          </Field>
                        </div>
                      </StepSection>

                      <StepSection title="Su mascota">
                        <div className="space-y-4">
                          <div>
                            <span className="label" id="species-label">
                              Especie
                            </span>
                            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1" role="radiogroup" aria-labelledby="species-label">
                              {SPECIES_OPTIONS.map((o) => {
                                const Icon = SPECIES_ICONS[o.value]
                                const on = form.species === o.value
                                return (
                                  <button
                                    key={o.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={on}
                                    onClick={() => setForm((f) => ({ ...f, species: o.value }))}
                                    className={`option flex shrink-0 items-center gap-2 rounded-full py-2 pl-3 pr-4 text-sm font-medium ${on ? 'bg-primary/[0.06]' : ''}`}
                                  >
                                    <Icon className={`h-4 w-4 ${on ? 'text-primary' : 'text-slate-400'}`} aria-hidden="true" />
                                    {o.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Nombre" htmlFor="f-petName" error={errors.petName}>
                              <input id="f-petName" className="input" value={form.petName} onChange={set('petName')} placeholder="Luna" aria-invalid={!!errors.petName} />
                            </Field>
                            <Field label="Raza (opcional)" htmlFor="f-breed">
                              <input id="f-breed" className="input" value={form.breed} onChange={set('breed')} placeholder="Mestizo" />
                            </Field>
                            <Field label="Motivo de la visita (opcional)" htmlFor="f-reason" className="sm:col-span-2">
                              <textarea id="f-reason" rows={2} className="input resize-none" value={form.reason} onChange={set('reason')} placeholder="Chequeo anual, no quiere comer…" />
                            </Field>
                          </div>
                        </div>
                      </StepSection>

                      <div className="space-y-3 border-t border-slate-100 pt-6">
                        <button type="submit" className="btn-accent btn-lg w-full">
                          Confirmar cita
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {channel !== 'ninguno' && (
                          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
                            <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                            Recibirá la confirmación por {channel === 'whatsapp' ? 'WhatsApp' : 'correo'} al instante.
                          </p>
                        )}
                        <div className="flex justify-center">
                          <BackButton onClick={() => setStep(3)} label="Cambiar horario" />
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </>
            )}
          </section>

          <aside className="hidden lg:sticky lg:top-6 lg:block">
            <Summary
              service={service}
              proChoice={proChoice}
              date={done ? done.appt.date : step > 2 ? date : null}
              slot={done ? { time: done.appt.start, proId: done.appt.professionalId } : step > 3 ? slot : null}
              proName={proName}
              done={!!done}
            />
          </aside>
        </div>
      </main>

      <ClinicFooter />
    </>
  )
}

/* ---------- Encabezado ---------- */

function Hero({ nextAvailable, onBookNext, onStart }) {
  const { config } = useStore()
  const { proName } = useLookups()
  const channel = config.notificationChannel
  const perks = [
    { icon: Zap, text: 'Confirmación inmediata' },
    channel !== 'ninguno' && { icon: Bell, text: `Recordatorio por ${channel === 'whatsapp' ? 'WhatsApp' : 'correo'}` },
    { icon: CalendarCheck, text: 'Reserve a cualquier hora' },
  ].filter(Boolean)

  const photo = config.heroImage

  return (
    <header className="relative isolate overflow-hidden bg-ink text-white">
      {/* Fondo: la foto ocupa todo el encabezado, con degradados para que el texto se lea */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        {photo ? (
          <>
            <HeroBackground url={photo} />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/90 via-ink/25 to-ink/85 lg:bg-gradient-to-r lg:from-ink/95 lg:via-ink/60 lg:to-ink/5" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink/80 to-transparent" />
            <div className="absolute -bottom-48 -left-40 h-[520px] w-[520px] rounded-full bg-secondary opacity-35 blur-[130px]" />
          </>
        ) : (
          <>
            <div className="absolute -left-40 -top-48 h-[520px] w-[520px] rounded-full bg-primary opacity-60 blur-[130px]" />
            <div className="absolute -right-32 top-24 h-[380px] w-[380px] rounded-full bg-secondary opacity-25 blur-[130px]" />
            <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(rgb(255 255 255) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
          </>
        )}
      </div>

      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Logo size="md" onDark />
          <BrandText field="clinicName" className="truncate text-[15px] font-semibold" />
        </div>
        <a href={`tel:${config.phone.replace(/[^\d+]/g, '')}`} className="btn h-9 shrink-0 rounded-full bg-white/10 px-3.5 text-white ring-1 ring-inset ring-white/15 backdrop-blur-md hover:bg-white/15">
          <Phone className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Llamar</span>
        </a>
      </nav>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-24 pt-8 sm:px-6 sm:pb-32 sm:pt-14 lg:min-h-[600px] lg:grid-cols-[1fr_330px] lg:items-end lg:gap-14 lg:pt-20">
        <div className="animate-fade-up self-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85 ring-1 ring-inset ring-white/15 backdrop-blur-md">
            <PawPrint className="h-3.5 w-3.5" aria-hidden="true" />
            Perros, gatos, aves y conejos
          </span>
          <h1 className="mt-5 max-w-xl text-[36px] font-semibold leading-[1.05] [text-shadow:0_2px_24px_rgb(0_0_0/0.35)] sm:text-[52px]">
            La cita de su mascota, <span className="text-white/60">en menos de un minuto.</span>
          </h1>
          <BrandText field="slogan" as="p" className="mt-5 max-w-lg text-base text-white/75 sm:text-lg" />
          {isPlaceholder('clinicName', config.clinicName) && <PlaceholderNote />}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button type="button" onClick={onStart} className="btn-primary btn-lg rounded-full shadow-[0_8px_20px_-8px_rgb(var(--c-primary)/0.7)]">
              Reservar ahora
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2.5 text-sm text-white/80">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                  <Icon className="h-3.5 w-3.5 text-white/85" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {nextAvailable && (
          <NextSlotCard
            nextAvailable={nextAvailable}
            onBookNext={onBookNext}
            proName={proName}
            className={`animate-fade-up [animation-delay:120ms] sm:max-w-[340px] ${photo ? 'mt-40 sm:mt-56 lg:mt-0 lg:self-start' : 'lg:self-center'}`}
          />
        )}
      </div>
    </header>
  )
}

/** Construye la URL de la foto. Las de Unsplash se piden al tamaño justo (más rápido en celular). */
function photoSrc(url, w) {
  if (!url) return ''
  if (!url.includes('images.unsplash.com')) return url
  const base = url.split('?')[0]
  return `${base}?w=${w}&q=72&auto=format&fit=crop`
}

/** Foto de fondo del encabezado. Aparece con un fundido; si no carga, queda el fondo oscuro de la marca. */
function HeroBackground({ url }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  if (failed) return null
  const isUnsplash = url.includes('images.unsplash.com')
  return (
    <img
      src={photoSrc(url, 1600)}
      srcSet={isUnsplash ? [800, 1200, 1600, 2200].map((w) => `${photoSrc(url, w)} ${w}w`).join(', ') : undefined}
      sizes="100vw"
      alt=""
      fetchpriority="high"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`absolute inset-0 h-full w-full object-cover object-[80%_center] sm:object-[72%_center] transition-[opacity,transform] duration-1000 ease-out lg:object-[center_35%] ${loaded ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0'}`}
    />
  )
}

function NextSlotCard({ nextAvailable, onBookNext, proName, className = '' }) {
  return (
    <div className={`rounded-[26px] bg-white/10 p-1.5 ring-1 ring-inset ring-white/20 backdrop-blur-md ${className}`}>
      <div className="rounded-[20px] bg-white p-4 text-ink shadow-pop">
        <p className="eyebrow !text-primary">Próximo horario libre</p>
        <div className="mt-2.5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="tabular text-[28px] font-semibold leading-none tracking-tight text-ink">{formatTime(nextAvailable.slot.time)}</p>
            <p className="mt-1 truncate text-sm text-slate-500">{formatDateTitle(nextAvailable.date)}</p>
          </div>
          <Avatar name={proName(nextAvailable.slot.proId)} className="!bg-primary/10 !text-primary" />
        </div>
        <p className="mt-2 truncate text-xs text-slate-500">
          {nextAvailable.service.name} · {proName(nextAvailable.slot.proId)}
        </p>
        <button type="button" onClick={onBookNext} className="btn-accent mt-3.5 h-10 w-full">
          Tomar este horario
        </button>
      </div>
    </div>
  )
}

function PlaceholderNote() {
  const { setCustomizeOpen } = useStore()
  return (
    <button
      type="button"
      onClick={() => setCustomizeOpen(true)}
      className="mt-4 flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/15"
    >
      <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
      Reemplaza “Tu Nombre Aquí” con el nombre de tu clínica
    </button>
  )
}

/* ---------- Piezas del flujo ---------- */

function StepSection({ title, subtitle, children }) {
  return (
    <section>
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Stepper({ step, onJump }) {
  return (
    <nav aria-label="Progreso de la reserva" className="mt-5">
      <ol className="flex items-center">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1
          const state = n < step ? 'done' : n === step ? 'current' : 'todo'
          return (
            <li key={label} className="flex flex-1 items-center last:flex-none" aria-current={state === 'current' ? 'step' : undefined}>
              <button
                type="button"
                disabled={state !== 'done'}
                onClick={() => onJump(n)}
                className="group flex items-center gap-2 disabled:cursor-default"
                aria-label={`Paso ${n}: ${label}${state === 'done' ? ' (completado, volver)' : ''}`}
              >
                <span
                  className={`tabular flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200 ${
                    state === 'done' ? 'bg-primary text-onprimary' : state === 'current' ? 'bg-ink text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {state === 'done' ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> : n}
                </span>
                <span className={`hidden text-sm font-medium sm:inline ${state === 'todo' ? 'text-slate-400' : 'text-ink'} ${state === 'done' ? 'group-hover:underline' : ''}`}>{label}</span>
              </button>
              {n < STEP_LABELS.length && (
                <span className="mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-slate-100 sm:mx-3" aria-hidden="true">
                  <span className={`block h-full bg-primary transition-transform duration-300 ease-out ${n < step ? 'translate-x-0' : '-translate-x-full'}`} />
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function RadioDot({ checked }) {
  return (
    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${checked ? 'bg-primary' : 'ring-1 ring-inset ring-slate-300'}`} aria-hidden="true">
      {checked && <Check className="h-3 w-3 text-onprimary" strokeWidth={3} />}
    </span>
  )
}

function BackButton({ onClick, label = 'Atrás' }) {
  return (
    <button type="button" onClick={onClick} className="btn-ghost -ml-3 h-9">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  )
}

function MobileSummary({ service, date, slot, proName }) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-900/5 lg:hidden">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-ring">
        <ServiceIcon id={service.id} className="h-5 w-5" />
      </span>
      <div className="min-w-0 text-sm">
        <p className="truncate font-semibold">{service.name}</p>
        <p className="truncate text-slate-500">
          {date ? formatDateTitle(date) : `${service.durationMin} min`}
          {slot && ` · ${formatTime(slot.time)} · ${proName(slot.proId)}`}
        </p>
      </div>
    </div>
  )
}

function MonthGrid({ days, today, selected, availability, onPick }) {
  const months = useMemo(() => {
    const groups = []
    for (const d of days) {
      const key = d.slice(0, 7)
      let g = groups.find((x) => x.key === key)
      if (!g) groups.push((g = { key, days: [] }))
      g.days.push(d)
    }
    return groups
  }, [days])

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {months.map((m) => {
        const offset = (weekday(m.days[0]) + 6) % 7 // lunes = 0
        const [y, mo] = m.key.split('-').map(Number)
        return (
          <div key={m.key}>
            <p className="mb-3 text-sm font-semibold capitalize">
              {MONTHS[mo - 1]} <span className="font-normal text-slate-400">{y}</span>
            </p>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((l, i) => (
                <span key={i} className="pb-1.5 text-[11px] font-medium text-slate-400">
                  {l}
                </span>
              ))}
              {Array.from({ length: offset }, (_, i) => (
                <span key={`b${i}`} />
              ))}
              {m.days.map((d) => {
                const count = availability[d]?.length || 0
                const isSel = selected === d
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={!count}
                    onClick={() => onPick(d)}
                    aria-pressed={isSel}
                    aria-label={`${formatDateTitle(d)}${count ? `, ${count} horarios` : ', sin horarios'}`}
                    className={`tabular relative flex h-11 items-center justify-center rounded-xl text-sm transition-[transform,background-color] duration-150 ease-out active:scale-95 disabled:active:scale-100 ${
                      isSel ? 'bg-primary font-semibold text-onprimary' : count ? 'font-semibold text-ink hover:bg-primary/10' : 'cursor-default text-slate-300'
                    } ${d === today && !isSel ? 'ring-1 ring-inset ring-slate-300' : ''}`}
                  >
                    {Number(d.slice(8))}
                    {count > 0 && !isSel && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-primary" aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Summary({ service, proChoice, date, slot, proName, done }) {
  const { config } = useStore()
  const rows = [
    { icon: Stethoscope, svc: service?.id, label: 'Servicio', value: service && `${service.name} · ${service.durationMin} min` },
    { icon: UserRound, label: 'Profesional', value: slot ? proName(slot.proId) : service ? (proChoice === 'any' ? 'El primero disponible' : proName(proChoice)) : null },
    { icon: CalendarCheck, label: 'Fecha', value: date && formatDateTitle(date) },
    { icon: Clock, label: 'Hora', value: slot && formatTime(slot.time) },
  ]
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Su cita</p>
        {done && <span className="chip bg-emerald-50 text-emerald-800 ring-emerald-600/20">Registrada</span>}
      </div>
      <ul className="mt-5 space-y-4">
        {rows.map(({ icon: Icon, svc, label, value }) => (
          <li key={label} className="flex items-center gap-3">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${value ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-300'}`}>
              {svc ? <ServiceIcon id={svc} className="h-[18px] w-[18px]" /> : <Icon className="h-[18px] w-[18px]" aria-hidden="true" />}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">{label}</p>
              <p key={value || 'empty'} className={`animate-fade-in truncate text-sm font-medium ${value ? 'text-ink' : 'text-slate-300'}`}>
                {value || 'Por elegir'}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm text-slate-600">
        <p className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <BrandText field="address" />
        </p>
        {config.notificationChannel !== 'ninguno' && (
          <p className="flex items-start gap-2.5">
            {config.notificationChannel === 'whatsapp' ? (
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            ) : (
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            )}
            Le recordamos su cita {config.reminderHoursBefore} horas antes.
          </p>
        )}
      </div>
    </div>
  )
}

/* ---------- Confirmación ---------- */

function Success({ done, config, proName, onRestart }) {
  const { appt, msg } = done
  const service = config.services.find((s) => s.id === appt.serviceId)

  function addToCalendar() {
    const ics = buildIcs({ appt, serviceName: service?.name || 'Cita', clinicName: config.clinicName, address: config.address })
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `cita-${appt.code}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-fade-up px-5 py-8 sm:px-8 sm:py-10" aria-live="polite">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 animate-scale-in items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_8px_24px_-6px_rgb(16_185_129/0.6)]">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="48" className="animate-draw" />
          </svg>
        </span>
        <h2 className="mt-5 text-2xl font-semibold sm:text-[28px]">¡Listo, {appt.ownerName.split(' ')[0]}!</h2>
        <p className="mt-1 text-slate-500">La cita de {appt.petName} quedó registrada.</p>
      </div>

      {/* Ticket */}
      <div className="mx-auto mt-8 max-w-md overflow-hidden rounded-3xl bg-slate-50 ring-1 ring-inset ring-slate-900/[0.06]">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary shadow-ring">
              <ServiceIcon id={appt.serviceId} className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">{service?.name}</p>
              <p className="text-sm text-slate-500">con {proName(appt.professionalId)}</p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Fecha</dt>
              <dd className="font-semibold">{formatDateTitle(appt.date)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Hora</dt>
              <dd className="tabular font-semibold">{formatTime(appt.start)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500">Mascota</dt>
              <dd className="font-semibold">
                {appt.petName}{' '}
                <span className="font-normal text-slate-500">
                  · {speciesLabel(appt.species)}
                  {appt.breed ? `, ${appt.breed}` : ''}
                </span>
              </dd>
            </div>
          </dl>
        </div>
        <div className="relative flex items-center" aria-hidden="true">
          <span className="absolute -left-3 h-6 w-6 rounded-full bg-white" />
          <span className="mx-6 h-px flex-1 border-t-2 border-dashed border-slate-200" />
          <span className="absolute -right-3 h-6 w-6 rounded-full bg-white" />
        </div>
        <div className="flex items-center justify-between gap-4 p-6">
          <div>
            <p className="eyebrow">Código de la cita</p>
            <p className="mt-1 whitespace-nowrap font-mono text-xl font-bold tracking-[0.1em] sm:text-2xl sm:tracking-[0.15em]">{appt.code}</p>
          </div>
          <button type="button" onClick={addToCalendar} className="btn-outline h-10 shrink-0 rounded-full px-3.5">
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Agregar al calendario</span>
            <span className="sm:hidden">Calendario</span>
          </button>
        </div>
      </div>

      {msg ? (
        <div className="mx-auto mt-8 max-w-md">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-600">
            {msg.channel === 'whatsapp' ? <MessageCircle className="h-4 w-4" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
            {msg.channel === 'whatsapp' ? 'Le llegó este mensaje por WhatsApp' : 'Le llegó este correo'}
          </p>
          <MessageView msg={msg} />
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-slate-500">Los avisos automáticos no están activados para esta clínica.</p>
      )}

      <div className="mt-8 text-center">
        <button type="button" className="btn-ghost" onClick={onRestart}>
          Reservar otra cita
        </button>
      </div>
    </div>
  )
}

/* ---------- Pie ---------- */

function ClinicFooter() {
  const items = [
    { icon: MapPin, field: 'address', label: 'Dirección' },
    { icon: Clock, field: 'hours', label: 'Horario' },
    { icon: Phone, field: 'phone', label: 'Teléfono' },
    { icon: Mail, field: 'email', label: 'Correo' },
  ]
  return (
    <footer className="border-t border-slate-900/[0.06] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <BrandText field="clinicName" className="font-semibold" />
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, field, label }) => (
            <div key={field} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 text-sm">
                <p className="text-xs font-medium text-primary">{label}</p>
                <BrandText field={field} className="block break-words text-slate-700" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6 text-xs text-slate-400">
          <span>Reservas en línea</span>
          <a href="#/admin" className="rounded px-1 hover:text-slate-600">
            Acceso personal
          </a>
        </div>
      </div>
    </footer>
  )
}
