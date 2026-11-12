# Demo: Agenda de citas para veterinarias

Demo web de ventas (Thinker). Tiene dos vistas conectadas:

- **Vista cliente**: reserva de cita en 4 pasos (servicio → profesional y fecha → horario → datos).
- **Vista admin** (`#/admin` o el enlace "Acceso personal" al pie de la página): calendario por día y por semana, lista con filtros, detalle de la cita (confirmar, editar, reprogramar, cancelar, marcar como completada o no asistió, enviar recordatorio), bloqueos de horario e historial de mensajes.

Funciona sin backend: todo se guarda en el `localStorage` del navegador. Los mensajes de WhatsApp y correo se **simulan** dentro de la página. No se envía nada real.

---

## 1. Correr la demo en tu computadora

Requisito: Node.js 18 o más reciente.

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. El admin está en `http://localhost:5173/#/admin` (PIN de demostración: `1234`).

Para generar la versión final (carpeta `dist/`):

```bash
npm run build
npm run preview
```

## 2. Cambiar de clínica editando `config.json`

Toda la personalización está en **`public/config.json`** (después de compilar queda en `dist/config.json`, y se puede editar ahí mismo sin volver a compilar).

| Campo | Para qué sirve |
|---|---|
| `clinicName`, `slogan`, `address`, `phone`, `email`, `hours` | Textos de la marca. Mientras tengan el texto de ejemplo ("Tu Nombre Aquí", etc.) se ven en gris con una nota de reemplazo. |
| `logoText` / `logoUrl` | Iniciales del logo, o una imagen (URL o base64). |
| `heroImage` | Foto de fondo de todo el encabezado (URL o base64). Mejor horizontal, con las mascotas hacia la derecha. Por defecto, una foto de Unsplash (licencia libre). Deje `""` para usar el fondo de color. |
| `primaryColor`, `secondaryColor` | Colores en hex (`#0F766E`). |
| `fontFamily` | `Inter`, `Poppins` o `Merriweather`. |
| `timezone` | `America/Santo_Domingo`. |
| `slotMinutes` | Cada cuántos minutos se ofrece un horario (15). |
| `bookingDaysAhead` | Cuántos días hacia adelante se puede reservar (30). |
| `notificationChannel` | `whatsapp`, `email` o `ninguno`. |
| `reminderHoursBefore` | Horas antes de la cita para el recordatorio (24). |
| `adminPin` | PIN del admin (`1234`). |
| `seed` | Número opcional. Con el mismo número, los datos de prueba iniciales salen iguales. |
| `services` | `{ id, name, durationMin, professionalIds }`. |
| `professionals` | `{ id, name, specialty, workDays, startTime, endTime, lunchStart, lunchEnd }`. `workDays` usa números: 0 = domingo, 1 = lunes … 6 = sábado. |

Hay un ejemplo completo con una clínica ficticia en `ejemplos/config-clinica-ficticia.json`.

> **Ojo:** si ya abriste la demo en ese navegador, los cambios hechos desde el panel tienen prioridad sobre `config.json`. Para ver el archivo tal cual, pulsa "Restablecer a placeholders" en el panel o abre la demo en una ventana privada.

### Checklist rápido por clínica (10 a 15 minutos)

1. Copia la carpeta del proyecto con el nombre de la clínica.
2. Edita `public/config.json`: nombre, slogan, colores, dirección, horario, servicios y profesionales.
3. Elige `notificationChannel`: `whatsapp` o `email`.
4. Despliega (ver sección 5).
5. Entra al admin y pulsa **"Regenerar datos demo"** para llenar la agenda.
6. Revisa en el celular el flujo de reserva y el calendario del admin.
7. Comparte el enlace solo con ese prospecto.

## 3. Panel "Personaliza tu demo"

El botón flotante **"Personaliza tu demo"** aparece en la vista cliente y en el admin. Desde ahí el cliente cambia en vivo:

- Nombre, slogan, dirección, teléfono, correo y horario.
- Logo (PNG o JPG, máximo 1 MB) o iniciales.
- Color principal y secundario, con vista previa.
- Tipografía (Inter, Poppins, Merriweather).
- Canal de recordatorios (WhatsApp, Correo o Ninguno) y cuántas horas antes se envían.
- Servicios: nombre, duración, quién los atiende, agregar o quitar.
- Profesionales: nombre, especialidad, días y horario de trabajo, almuerzo.

Los cambios se guardan en el navegador y no se pierden al recargar.

- **Descargar mi configuración**: baja un archivo `config-<nombre>.json` con la versión actual. Ese archivo se puede usar directamente como `public/config.json`.
- **Cargar configuración**: sube un JSON con el mismo formato.
- **Restablecer a placeholders**: borra los cambios del panel y vuelve a lo que diga `config.json`.

## 4. Cambiar el canal de recordatorios

- En `config.json`: `"notificationChannel": "whatsapp"` (o `"email"`, o `"ninguno"`).
- O desde el panel, en la sección "Canal de recordatorios".

Con `whatsapp`, los mensajes se muestran como una burbuja de WhatsApp. Con `email`, como un correo con remitente, asunto y cuerpo. Con `ninguno`, no se envía nada y los botones de recordatorio aparecen deshabilitados con el texto "Canal no configurado".

En el admin, **"Simular envío de recordatorios de mañana"** recorre las citas de mañana con estado pendiente o confirmada y le envía el recordatorio a cada una. Todo queda en la pestaña "Mensajes enviados".

## 5. Desplegar en Vercel o Netlify

Es un sitio estático. No hay que configurar nada extra.

**Vercel**
1. Sube la carpeta a un repositorio de GitHub e impórtalo en Vercel, o ejecuta `npx vercel` dentro de la carpeta.
2. Framework: Vite. Build command: `npm run build`. Output: `dist`.
3. `vercel.json` ya incluye la ruta `/admin`.

**Netlify**
1. Arrastra la carpeta `dist/` (después de `npm run build`) a app.netlify.com/drop, o conecta el repositorio.
2. Build command: `npm run build`. Publish directory: `dist`.
3. `public/_redirects` ya incluye la ruta `/admin`.

El admin siempre funciona también con `tu-sitio.com/#/admin`.

## 6. Lo que la demo NO incluye

Para dejarlo claro con el cliente:

- **Pagos en línea.** No se cobra nada desde la demo.
- **Envío real de WhatsApp o correo.** Los mensajes se simulan. En producción se usa la API oficial de WhatsApp Business (con plantillas de utilidad aprobadas por Meta) o un proveedor de correo transaccional.
- **Login de usuarios.** El admin usa un PIN de demostración, no una cuenta real.
- **Multi-clínica.** Cada demo es de una sola clínica.
- **Base de datos.** Los datos viven en el navegador de quien abre la demo. Otra persona u otro dispositivo verá sus propios datos. Para un cliente real se reemplaza por Supabase o similar, con el mismo modelo de datos.
- **Historias clínicas completas.** Solo hay un historial básico de citas por mascota.
- **Precios o cotizaciones.** No aparecen en ninguna parte.

## Estructura del código

```
public/config.json        ← la única pieza que se edita por clínica
src/lib/config.js         ← carga y valida la configuración
src/lib/slots.js          ← cálculo de horarios libres (horario, almuerzo, citas, bloqueos, margen de 5 min)
src/lib/seed.js           ← datos de prueba (dueños, mascotas, citas)
src/lib/notify.js         ← capa de notificaciones: send({ channel, to, template, data })
src/store.jsx             ← estado global y guardado en localStorage
src/client/Booking.jsx    ← vista cliente
src/admin/*               ← vista admin
src/components/*          ← banner, panel de personalización, visor de mensajes
```
