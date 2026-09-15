// api/enviar-recordatorio.js
// Función serverless de Vercel: se ejecuta en el servidor, nunca en el navegador,
// así que aquí es seguro usar la contraseña de aplicación de Gmail.

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export default async function handler(req, res) {
  // Solo aceptar peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { destinatario, nombreCliente, fechaCita } = req.body;

  if (!destinatario || !nombreCliente || !fechaCita) {
    return res.status(400).json({ error: 'Faltan datos: destinatario, nombreCliente o fechaCita' });
  }

  try {
    await transporter.sendMail({
      from: `"Kajalu Stetic" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: 'Recordatorio de tu cita en Kajalu Stetic',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>¡Hola ${nombreCliente}!</h2>
          <p>Te recordamos tu cita programada para el <strong>${fechaCita}</strong>.</p>
          <p>Si necesitas reprogramar, escríbenos por WhatsApp al 314 539 0510.</p>
          <p>¡Te esperamos en Kajalu Stetic!</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, message: 'Recordatorio enviado correctamente' });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    return res.status(500).json({ error: 'No se pudo enviar el correo' });
  }
}
