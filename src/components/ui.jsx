import { useEffect, useRef } from 'react'
import { PawPrint, PencilLine, UserRound, X } from 'lucide-react'
import { useStore } from '../store.jsx'
import { isPlaceholder } from '../lib/config.js'
import { STATUSES } from '../lib/appointments.js'

/** Modal: hoja inferior en celular, diálogo centrado en escritorio. Entra con animación, sale al instante. */
export function Modal({ open, onClose, title, subtitle, children, size = 'md', footer, icon: Icon }) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement
    ref.current?.focus()
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      // Solo cierra el diálogo de arriba
      const dialogs = document.querySelectorAll('[data-modal]')
      if (dialogs[dialogs.length - 1] === ref.current) closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      prev?.focus?.()
    }
  }, [open])

  if (!open) return null
  const width = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }[size]
  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-slate-950/40 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        data-modal
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92vh] w-full animate-sheet-up flex-col rounded-t-[28px] bg-white shadow-pop outline-none sm:animate-scale-in sm:rounded-3xl ${width}`}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4 px-6 pb-3 pt-4 sm:pt-6">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{title}</h2>
              {subtitle && <p className="truncate text-sm text-slate-500">{subtitle}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-icon btn-ghost -mr-2 shrink-0" aria-label="Cerrar">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

/**
 * Texto de marca. Si sigue siendo el placeholder se ve atenuado, con subrayado punteado,
 * y (con `note`) una píldora que abre el panel de personalización.
 */
export function BrandText({ field, as: Tag = 'span', className = '', note = false, placeholderClass = 'opacity-55', noteTone = 'light' }) {
  const { config, setCustomizeOpen } = useStore()
  const value = config[field]
  const placeholder = isPlaceholder(field, value)
  return (
    <Tag className={className}>
      <span
        className={placeholder ? `${placeholderClass} underline decoration-dotted decoration-1 underline-offset-[6px]` : ''}
        title={placeholder ? 'Texto de ejemplo: cámbialo en "Personaliza tu demo"' : undefined}
      >
        {value}
      </span>
      {placeholder && note && (
        <button
          type="button"
          onClick={() => setCustomizeOpen(true)}
          className={`mt-2 flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tracking-normal transition-colors ${
            noteTone === 'dark' ? 'bg-white/10 text-white/80 hover:bg-white/15' : 'bg-slate-900/5 text-slate-600 hover:bg-slate-900/10'
          }`}
        >
          <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
          Reemplaza este texto con el nombre de tu clínica
        </button>
      )}
    </Tag>
  )
}

/**
 * Logo del negocio. Si la clínica subió su logo, se usa esa imagen.
 * Si no, una huella (sin letras ni fondo de color): teal sobre fondos claros, blanca sobre fondos oscuros.
 */
export function Logo({ size = 'md', className = '', onDark = false }) {
  const { config } = useStore()
  const dims = { sm: 'h-8 w-8 rounded-lg', md: 'h-10 w-10 rounded-xl', lg: 'h-14 w-14 rounded-2xl' }[size]
  if (config.logoUrl) {
    return <img src={config.logoUrl} alt={`Logo de ${config.clinicName}`} className={`${dims} shrink-0 bg-white object-contain ${className}`} />
  }
  const icon = { sm: 'h-7 w-7', md: 'h-8 w-8', lg: 'h-12 w-12' }[size]
  return (
    <span className={`${dims} flex shrink-0 items-center justify-center ${onDark ? 'text-white' : 'text-primary'} ${className}`} aria-hidden="true">
      <PawPrint className={icon} strokeWidth={1.75} />
    </span>
  )
}

export function StatusBadge({ status }) {
  const s = STATUSES[status] || STATUSES.pendiente
  return (
    <span className={`chip ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  )
}

export function Field({ label, error, hint, children, htmlFor, className = '' }) {
  return (
    <div className={className}>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export const initials = (name) =>
  String(name || '?')
    .replace(/^(Dra?\.|Lic\.)\s*/i, '')
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

/** Ícono de persona (profesionales). Usa el color de acento como color terciario. */
export function Avatar({ size = 'md', className = '' }) {
  const dims = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10'
  const icon = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent ${dims} ${className}`} aria-hidden="true">
      <UserRound className={icon} />
    </span>
  )
}

export function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {Icon && (
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {children}
    </div>
  )
}
