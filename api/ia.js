// Esta función corre en el servidor de Vercel (no en el navegador del cliente),
// así que la llave de la IA nunca queda expuesta públicamente.

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function llamarGemini(modelo, apiKey, prompt) {
  const respuesta = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4096 },
      }),
    }
  );
  const data = await respuesta.json();
  return { ok: respuesta.ok, status: respuesta.status, data };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { prompt } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: "Falta el prompt" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Falta configurar GEMINI_API_KEY en Vercel" });
    }

    // Intenta varias veces y con un modelo de respaldo si el principal está saturado (503)
    const modelos = ["gemini-flash-latest", "gemini-flash-latest", "gemini-flash-lite-latest"];
    let ultimo = null;

    for (let i = 0; i < modelos.length; i++) {
      if (i > 0) await espera(1500);
      ultimo = await llamarGemini(modelos[i], apiKey, prompt);
      if (ultimo.ok) break;
      if (ultimo.status !== 503) break; // si no es "saturado", no tiene sentido reintentar
    }

    if (!ultimo.ok) {
      return res.status(ultimo.status).json({ error: ultimo.data?.error?.message || "Error al llamar a Gemini" });
    }

    const partes = ultimo.data?.candidates?.[0]?.content?.parts || [];
    const texto = partes.filter((p) => !p.thought).map((p) => p.text || "").join("").trim();

    if (!texto) {
      const razon = ultimo.data?.promptFeedback?.blockReason || ultimo.data?.candidates?.[0]?.finishReason || "desconocida";
      return res.status(502).json({ error: `La IA no devolvió contenido (razón: ${razon})` });
    }

    return res.status(200).json({ text: texto });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

