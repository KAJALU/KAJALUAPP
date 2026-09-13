// Esta función corre en el servidor de Vercel (no en el navegador del cliente),
// así que la llave de la IA nunca queda expuesta públicamente.
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

    const respuesta = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await respuesta.json();
    const partes = data?.candidates?.[0]?.content?.parts || [];
    const texto = partes.filter((p) => !p.thought).map((p) => p.text || "").join("").trim();

    if (!texto) {
      return res.status(502).json({ error: "La IA no devolvió contenido", detalle: data });
    }

    return res.status(200).json({ text: texto });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
