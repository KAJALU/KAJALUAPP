// api/recordatorio-diario.js
// Se ejecuta automáticamente cada día (configurado como Cron Job en vercel.json).
// Busca las citas programadas para MAÑANA y envía un correo de recordatorio a cada cliente.

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export default async function handler(req, res) {
  try {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fechaManana = manana.toISOString().split('T')[0];

    const { data: citas, error } = await supabase
      .from('citas')
      .select('correo, nombre, fecha, hora')
      .eq('fecha', fechaManana);

    if (error) throw error;

    if (!citas || citas.length === 0) {
      return res.status(200).json({ message: 'No hay citas para mañana' });
    }

    const resultados = [];

    for (const cita of citas) {
      try {
        const horaTexto = cita.hora ? ` a las ${cita.hora.slice(0, 5)}` : '';
        await transporter.sendMail({
          from: `"Kajalu Stetic" <${process.env.EMAIL_USER}>`,
          to: cita.correo,
          subject: 'Recordatorio: tu cita es mañana',
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>¡Hola ${cita.nombre}!</h2>
              <p>Te recordamos que tu cita en <strong>Kajalu Stetic</strong> es <strong>mañana, ${cita.fecha}${horaTexto}</strong>.</p>
              <p>Si necesitas reprogramar, escríbenos por WhatsApp al 314 539 0510.</p>
              <p>¡Te esperamos!</p>
            </div>
          `,
        });
        resultados.push({ correo: cita.correo, enviado: true });
      } catch (err) {
        console.error(`Error enviando a ${cita.correo}:`, err);
        resultados.push({ correo: cita.correo, enviado: false });
      }
    }

    return res.status(200).json({ success: true, resultados });
  } catch (error) {
    console.error('Error en recordatorio diario:', error);
    return res.status(500).json({ error: 'Error al procesar recordatorios' });
  }
}
