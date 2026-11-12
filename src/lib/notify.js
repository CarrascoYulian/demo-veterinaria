// Capa de notificaciones. Una sola interfaz: send({ channel, to, template, data }).
// Ambos adaptadores están en modo SIMULACIÓN: construyen el mensaje, no envían nada.

import { uid } from './ids.js'

export const TEMPLATE_LABELS = {
  confirmacion: 'Confirmación de cita',
  recordatorio: 'Recordatorio de cita',
}

const WHATSAPP_TEMPLATES = {
  confirmacion:
    'Hola {{nombre}}, su cita para {{mascota}} en {{clinica}} quedó registrada el {{fecha}} a las {{hora}}. Código: {{codigo}}.',
  recordatorio:
    'Hola {{nombre}}, le recordamos la cita de {{mascota}} en {{clinica}} el {{fecha}} a las {{hora}}. Para confirmar responda 1, para cancelar responda 2.',
}

const EMAIL_TEMPLATES = {
  confirmacion: {
    subject: 'Cita registrada para {{mascota}} - {{fecha}} {{hora}}',
    body: [
      'Hola {{nombre}},',
      'Su cita para {{mascota}} en {{clinica}} quedó registrada el {{fecha}} a las {{hora}}.',
      'Servicio: {{servicio}}\nCódigo de la cita: {{codigo}}',
      'Si necesita cambiarla, llámenos al {{telefono}}.',
      'Saludos,\n{{clinica}}',
    ],
  },
  recordatorio: {
    subject: 'Recordatorio de cita para {{mascota}} - {{fecha}} {{hora}}',
    body: [
      'Hola {{nombre}},',
      'Le recordamos la cita de {{mascota}} en {{clinica}} el {{fecha}} a las {{hora}}.',
      'Servicio: {{servicio}}\nCódigo de la cita: {{codigo}}',
      'Para confirmar o cancelar, responda este correo o llámenos al {{telefono}}.',
      'Saludos,\n{{clinica}}',
    ],
  },
}

// El segundo replace evita "10:00 a. m.." cuando la hora termina en punto y la plantilla también.
export const render = (tpl, data) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => data[k] ?? '').replace(/\.\.(?!\.)/g, '.')

const whatsappAdapter = {
  build({ to, template, data }) {
    return {
      to,
      body: render(WHATSAPP_TEMPLATES[template], data),
      status: to ? 'entregado' : 'sin teléfono',
    }
  },
}

const emailAdapter = {
  build({ to, template, data }) {
    const t = EMAIL_TEMPLATES[template]
    return {
      to,
      subject: render(t.subject, data),
      paragraphs: t.body.map((p) => render(p, data)),
      status: to ? 'entregado' : 'sin correo',
    }
  },
}

const adapters = { whatsapp: whatsappAdapter, email: emailAdapter }

/** Devuelve el registro del mensaje, o null si el canal es "ninguno". */
export function send({ channel, to, template, data }) {
  const adapter = adapters[channel]
  if (!adapter) return null
  return {
    id: uid(),
    at: new Date().toISOString(),
    channel,
    template,
    from: data.clinica,
    fromEmail: data.correoClinica,
    ...adapter.build({ to, template, data }),
  }
}

export const NOTES = {
  whatsapp: 'Simulación. En producción se usa la API oficial de WhatsApp Business con plantillas aprobadas.',
  email: 'Simulación. En producción se usa un proveedor de correo transaccional.',
}
