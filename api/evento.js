function pad(n) { return n.toString().padStart(2, '0'); }

function escaparICS(texto) {
  return String(texto || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

module.exports = (req, res) => {
  const {
    objeto = '',
    persona = '',
    fechaPrestamo = '',
    fechaDevolucion = '',
    recordatorioDias = '1',
    id = ''
  } = req.query;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaDevolucion)) {
    res.status(400).send('Fecha de devolución inválida');
    return;
  }

  const [y, m, d] = fechaDevolucion.split('-').map(Number);
  const dtstart = `${y}${pad(m)}${pad(d)}T090000`;
  const dtend = `${y}${pad(m)}${pad(d)}T093000`;

  const ahora = new Date();
  const dtstamp = `${ahora.getUTCFullYear()}${pad(ahora.getUTCMonth() + 1)}${pad(ahora.getUTCDate())}T${pad(ahora.getUTCHours())}${pad(ahora.getUTCMinutes())}${pad(ahora.getUTCSeconds())}Z`;

  const dias = parseInt(recordatorioDias, 10) || 0;
  const trigger = dias > 0 ? `-P${dias}D` : 'PT0S';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AQuienSeLoPreste//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${id || Date.now()}@aquienseloprestre`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:Devolver: ${escaparICS(objeto)} (${escaparICS(persona)})`,
    `DESCRIPTION:Prestado el ${escaparICS(fechaPrestamo)} a ${escaparICS(persona)}. Recuerda pedir de vuelta: ${escaparICS(objeto)}.`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio de devolución',
    `TRIGGER:${trigger}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="evento.ics"');
  res.status(200).send(ics);
};
