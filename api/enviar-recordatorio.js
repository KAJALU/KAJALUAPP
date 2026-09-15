// api/enviar-recordatorio.js
// Función serverless de Vercel: se llama justo cuando una clienta agenda una cita,
// para enviarle el correo de que su solicitud fue recibida (pendiente de confirmar disponibilidad).

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

function formatearHora(horaStr) {
  if (!horaStr) return '';
  const [horas, minutos] = horaStr.split(':');
  let h = parseInt(horas, 10);
  const ampm = h >= 12 ? 'p.m.' : 'a.m.';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${minutos} ${ampm}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { destinatario, nombreCliente, fechaCita, horaCita } = req.body;

  if (!destinatario || !nombreCliente || !fechaCita) {
    return res.status(400).json({ error: 'Faltan datos: destinatario, nombreCliente o fechaCita' });
  }

  const horaTexto = horaCita ? ` a las ${formatearHora(horaCita)}` : '';

  try {
    await transporter.sendMail({
      from: `"Kajalu Stetic" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: 'Recibimos tu solicitud de cita - Kajalu Stetic',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>¡Hola ${nombreCliente}!</h2>
          <p>Recibimos tu solicitud de cita en <strong>Kajalu Stetic</strong> para el <strong>${fechaCita}${horaTexto}</strong>.</p>
          <p>Está <strong>pendiente de confirmar disponibilidad</strong> — te avisaremos muy pronto si queda confirmada.</p>
          <p>Si necesitas algo más, escríbenos por WhatsApp al 314 539 0510.</p>
          <p>¡Gracias por tu preferencia!</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, message: 'Correo enviado correctamente' });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    return res.status(500).json({ error: 'No se pudo enviar el correo' });
  }
}
