// api/enviar-recordatorio.js
// Función serverless de Vercel: se llama justo cuando una clienta agenda una cita,
// para enviarle la confirmación inmediata por correo.

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
      subject: 'Confirmación de tu cita en Kajalu Stetic',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>¡Hola ${nombreCliente}!</h2>
          <p>Tu cita en <strong>Kajalu Stetic</strong> quedó agendada para el <strong>${fechaCita}${horaTexto}</strong>.</p>
          <p>Si necesitas reprogramar, escríbenos por WhatsApp al 314 539 0510.</p>
          <p>¡Te esperamos!</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, message: 'Confirmación enviada correctamente' });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    return res.status(500).json({ error: 'No se pudo enviar el correo' });
  }
}
