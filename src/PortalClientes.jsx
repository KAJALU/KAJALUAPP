import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Sparkles, LogOut, MessageCircle } from "lucide-react";

export default function PortalClientes() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [modo, setModo] = useState("login"); // "login" | "registro" | "recuperar"
  const [form, setForm] = useState({ nombre: "", correo: "", clave: "" });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [perfil, setPerfil] = useState(null);
  const [perfilForm, setPerfilForm] = useState({ nombre: "", telefono: "", preferencias: "" });
  const [guardando, setGuardando] = useState(false);

  const [mensajeCita, setMensajeCita] = useState("");
  const [enviandoCita, setEnviandoCita] = useState(false);
  const [respuestaCita, setRespuestaCita] = useState("");
  const [errorCita, setErrorCita] = useState("");

  // --- Contenido editable del portal (catálogo, promociones, tips, etc.) ---
  const ADMIN_EMAILS = ["kajaluapp@gmail.com"];
  const contenidoSemilla = {
    tabs: [
      { id: "catalogo", label: "Catálogo", tipo: "catalogo", items: [
        { titulo: "Manicure spa — $35.000", detalle: "Limado, cutícula, hidratación y esmaltado." },
        { titulo: "Pestañas pelo a pelo — $60.000", detalle: "Efecto natural, duración de 3 semanas." },
      ]},
      { id: "promociones", label: "Promociones", tipo: "info", items: [
        { titulo: "2x1 en manicure", detalle: "Válido de lunes a miércoles, agenda con una amiga." },
      ]},
      { id: "tips", label: "Tips", tipo: "info", items: [
        { titulo: "Cuida tu esmaltado", detalle: "Usa guantes al lavar loza para que dure más tiempo." },
      ]},
      { id: "resenas", label: "Reseñas", tipo: "resenas", items: [] },
    ],
  };
  const [contenido, setContenido] = useState(contenidoSemilla);
  const [tabActiva, setTabActiva] = useState("catalogo");
  const [nuevoItem, setNuevoItem] = useState({ titulo: "", detalle: "" });
  const [nuevaPestañaNombre, setNuevaPestañaNombre] = useState("");
  const [nuevaPestañaTipo, setNuevaPestañaTipo] = useState("info");
  const [mostrandoFormPestaña, setMostrandoFormPestaña] = useState(false);
  const [textoResena, setTextoResena] = useState("");
  const esAdmin = !!session && ADMIN_EMAILS.includes((session.user.email || "").toLowerCase());

  const [mensajeDelDia, setMensajeDelDia] = useState("¡Bienvenida a Kajalu!");
  const [mostrarEdicionPerfil, setMostrarEdicionPerfil] = useState(false);
  const perfilCompleto = !!(perfil && perfil.nombre && perfil.telefono);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setPerfil(null); return; }
    (async () => {
      const { data, error } = await supabase
        .from("perfiles_clientes")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!error && data) {
        setPerfil(data);
        setPerfilForm({ nombre: data.nombre || "", telefono: data.telefono || "", preferencias: data.preferencias || "" });
      }
    })();
  }, [session]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data: fila } = await supabase
        .from("app_data")
        .select("data")
        .eq("id", "main")
        .maybeSingle();
      const contenidoGuardado = fila?.data?.contenido;
      if (contenidoGuardado && contenidoGuardado.tabs && contenidoGuardado.tabs.length > 0) {
        setContenido(contenidoGuardado);
        setTabActiva(contenidoGuardado.tabs[0].id);
      }

      const hoy = new Date().toISOString().slice(0, 10);
      const mensajeGuardado = fila?.data?.mensajeDia;
      if (mensajeGuardado && mensajeGuardado.fecha === hoy) {
        setMensajeDelDia(mensajeGuardado.texto);
        return;
      }

      // Todavía no hay mensaje generado hoy: se lo pedimos a la IA y lo guardamos para todas
      try {
        const prompt = `Eres la asistente de Kajalu Stetic, un centro de belleza. Escribe un único mensaje de bienvenida corto (máximo 18 palabras), cálido y variado, para las clientas que abren la app hoy. Puede ser un tip de belleza, autocuidado, o una frase motivadora. Responde SOLO con el mensaje, sin comillas ni texto adicional.`;
        const res = await fetch("/api/ia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        const texto = (data.text || "").trim().replace(/^"|"$/g, "") || "Hoy es un buen día para consentirte un poco.";
        setMensajeDelDia(texto);

        const actual = fila?.data || {};
        await supabase.from("app_data").upsert({
          id: "main",
          data: { ...actual, mensajeDia: { fecha: hoy, texto } },
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        setMensajeDelDia("Hoy es un buen día para consentirte un poco.");
      }
    })();
  }, [session]);

  const guardarContenido = async (nuevoContenido) => {
    const { data: fila } = await supabase.from("app_data").select("data").eq("id", "main").maybeSingle();
    const actual = fila?.data || {};
    const nuevaData = { ...actual, contenido: nuevoContenido };
    await supabase.from("app_data").upsert({ id: "main", data: nuevaData, updated_at: new Date().toISOString() });
    setContenido(nuevoContenido);
  };

  const agregarPestaña = async () => {
    if (!nuevaPestañaNombre.trim()) return;
    const id = nuevaPestañaNombre.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
    const nuevaTab = { id, label: nuevaPestañaNombre.trim(), tipo: nuevaPestañaTipo, items: [] };
    const nuevoContenido = { ...contenido, tabs: [...contenido.tabs, nuevaTab] };
    await guardarContenido(nuevoContenido);
    setTabActiva(id);
    setNuevaPestañaNombre("");
    setNuevaPestañaTipo("info");
    setMostrandoFormPestaña(false);
  };

  const publicarResena = async () => {
    if (!textoResena.trim()) return;
    const item = { titulo: perfilForm.nombre || session.user.email, detalle: textoResena.trim() };
    const nuevasTabs = contenido.tabs.map((t) =>
      t.id === tabActiva ? { ...t, items: [...t.items, item] } : t
    );
    await guardarContenido({ ...contenido, tabs: nuevasTabs });
    setTextoResena("");
  };

  const eliminarPestaña = async (id) => {
    const nuevasTabs = contenido.tabs.filter((t) => t.id !== id);
    const nuevoContenido = { ...contenido, tabs: nuevasTabs };
    await guardarContenido(nuevoContenido);
    if (tabActiva === id && nuevasTabs.length > 0) setTabActiva(nuevasTabs[0].id);
  };

  const agregarItem = async () => {
    if (!nuevoItem.titulo.trim()) return;
    const nuevasTabs = contenido.tabs.map((t) =>
      t.id === tabActiva ? { ...t, items: [...t.items, { ...nuevoItem }] } : t
    );
    await guardarContenido({ ...contenido, tabs: nuevasTabs });
    setNuevoItem({ titulo: "", detalle: "" });
  };

  const eliminarItem = async (index) => {
    const nuevasTabs = contenido.tabs.map((t) =>
      t.id === tabActiva ? { ...t, items: t.items.filter((_, i) => i !== index) } : t
    );
    await guardarContenido({ ...contenido, tabs: nuevasTabs });
  };

  const contraseñaValida = (clave) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-]).{6,}$/.test(clave);

  const registrar = async () => {
    setError(""); setMensaje("");
    if (!contraseñaValida(form.clave)) {
      setError("La contraseña debe tener mínimo 6 caracteres, con al menos 1 mayúscula, 1 número y 1 carácter especial.");
      return;
    }
    setCargando(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.correo,
        password: form.clave,
        options: { data: { nombre: form.nombre } },
      });
      if (error) setError(error.message);
      else setMensaje("¡Cuenta creada! Revisa tu correo para confirmar (si aplica) y luego inicia sesión.");
    } catch (e) {
      setError("No se pudo conectar. Si usas VPN o un bloqueador de anuncios, desactívalo e intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  const iniciarSesion = async () => {
    setError(""); setMensaje(""); setCargando(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: form.correo, password: form.clave });
      if (error) setError(error.message);
    } catch (e) {
      setError("No se pudo conectar. Si usas VPN o un bloqueador de anuncios, desactívalo e intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  const recuperarClave = async () => {
    if (!form.correo.trim()) { setError("Escribe tu correo para poder enviarte el enlace."); return; }
    setError(""); setMensaje(""); setCargando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(form.correo, {
      redirectTo: window.location.origin + "/clientes",
    });
    setCargando(false);
    if (error) setError(error.message);
    else setMensaje("Te enviamos un correo con un enlace para crear una nueva contraseña.");
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
  };

  const guardarPerfil = async () => {
    setGuardando(true);
    await supabase.from("perfiles_clientes").update(perfilForm).eq("id", session.user.id);
    setPerfil({ ...(perfil || {}), ...perfilForm });
    setGuardando(false);
    setMensaje("Datos actualizados. ¡Gracias por contarnos más sobre ti!");
  };

  const enviarSolicitudCita = async () => {
    if (!mensajeCita.trim()) return;
    setEnviandoCita(true); setErrorCita(""); setRespuestaCita("");
    try {
      const hoy = new Date().toISOString().slice(0, 10);
      const prompt = `Eres la asistente de reservas de Kajalu Stetic, un centro de belleza. Hoy es ${hoy}.
Una clienta escribió esta solicitud: "${mensajeCita}"

Extrae los datos de la cita y responde ÚNICAMENTE con un JSON válido (sin texto adicional, sin backticks) con esta forma exacta:
{"servicio":"nombre del servicio solicitado","fecha":"YYYY-MM-DD","hora":"HH:MM","respuesta":"mensaje corto y amable confirmando que la solicitud fue enviada, mencionando servicio, fecha y hora"}

Si falta la hora, usa "10:00". Si falta la fecha, usa el próximo día hábil.`;

      const res = await fetch("/api/ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error de IA");
      const parsed = JSON.parse((data.text || "").replace(/```json|```/g, "").trim());

      const { data: fila, error: errLectura } = await supabase
        .from("app_data")
        .select("data")
        .eq("id", "main")
        .maybeSingle();
      if (errLectura) throw errLectura;

      const actual = fila?.data || {};
      const citasActuales = actual.citas || [];
      const nombreCliente = perfilForm.nombre || session.user.email;
      const correoCliente = session.user.email;

      // Verificar disponibilidad: ¿ya hay una cita activa en esa misma fecha y hora?
      const horarioOcupado = citasActuales.some(
        (c) => c.fecha === parsed.fecha && c.hora === parsed.hora && c.estado !== "cancelada"
      );
      if (horarioOcupado) {
        setErrorCita("Ese horario ya está reservado. Por favor elige otra fecha u hora.");
        setEnviandoCita(false);
        return;
      }

      const nuevaCita = {
        id: Math.random().toString(36).slice(2, 9),
        cliente: nombreCliente,
        servicio: parsed.servicio,
        fecha: parsed.fecha,
        hora: parsed.hora,
        precio: 0,
        estado: "pendiente",
      };
      const nuevaData = { ...actual, citas: [...citasActuales, nuevaCita] };

      const { error: errGuardar } = await supabase
        .from("app_data")
        .upsert({ id: "main", data: nuevaData, updated_at: new Date().toISOString() });
      if (errGuardar) throw errGuardar;

      // Guardar también en la tabla "citas" para que el recordatorio del día anterior la encuentre
      await supabase.from("citas").insert({
        nombre: nombreCliente,
        correo: correoCliente,
        fecha: parsed.fecha,
        hora: parsed.hora,
      });

      // Enviar el correo de confirmación inmediata (si falla, no interrumpe el flujo de la clienta)
      try {
        await fetch("/api/enviar-recordatorio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destinatario: correoCliente,
            nombreCliente: nombreCliente,
            fechaCita: parsed.fecha,
            horaCita: parsed.hora,
          }),
        });
      } catch (errCorreo) {
        console.error("No se pudo enviar el correo de confirmación:", errCorreo);
      }

      setRespuestaCita(
        `Recibimos tu solicitud para ${parsed.servicio} el ${parsed.fecha} a las ${parsed.hora}. Está pendiente de confirmar disponibilidad, te avisaremos pronto.`
      );
      setMensajeCita("");
    } catch (e) {
      setErrorCita("No pudimos procesar tu solicitud. Intenta escribirla de otra forma o usa el botón de WhatsApp.");
    } finally {
      setEnviandoCita(false);
    }
  };

  if (checkingSession) return null;

  return (
    <div className="p-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600&display=swap');
        .p-root {
          --bg: #FAF6F2; --surface: #FFFFFF; --ink: #2A1E24; --ink-soft: #7A6870;
          --accent: #9C3D57; --accent-soft: #F1DCE0; --line: #E7DAD2; --danger: #B8503F; --success: #4F7A5A;
          font-family: 'Inter', sans-serif; background: var(--bg); min-height: 100vh;
          display: flex; align-items: center; justify-content: center; padding: 24px;
        }
        .p-root * { box-sizing: border-box; }
        .p-card { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 32px; width: 100%; max-width: 420px; }
        .p-logo { font-family: 'Fraunces', serif; font-style: italic; font-size: 28px; color: var(--accent); margin-bottom: 4px; }
        .p-sub { color: var(--ink-soft); font-size: 13.5px; margin-bottom: 22px; }
        .p-root input { width: 100%; font-family: 'Inter', sans-serif; font-size: 14px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); margin-bottom: 10px; }
        .p-root input:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
        .p-btn { width: 100%; background: var(--accent); color: white; border: none; border-radius: 8px; padding: 11px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 4px; }
        .p-btn:disabled { opacity: 0.7; }
        .p-link { background: none; border: none; color: var(--accent); font-size: 13px; cursor: pointer; margin-top: 14px; text-align: center; width: 100%; font-family: 'Inter', sans-serif; }
        .p-error { color: var(--danger); font-size: 13px; margin-bottom: 10px; }
        .p-msg { color: var(--success); font-size: 13px; margin-bottom: 10px; }
        .p-title { font-family: 'Fraunces', serif; font-size: 20px; margin-bottom: 4px; }
        .p-signout { display: flex; align-items: center; gap: 6px; background: none; border: none; color: var(--ink-soft); font-size: 12.5px; cursor: pointer; margin-top: 18px; }
        textarea.p-textarea { width: 100%; font-family: 'Inter', sans-serif; font-size: 13.5px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); resize: vertical; min-height: 70px; margin-bottom: 10px; }
        .p-tabs { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 12px; }
        .p-tab { font-family: 'Inter', sans-serif; font-size: 12.5px; padding: 6px 10px; border-radius: 20px; border: 1px solid var(--line); background: var(--bg); color: var(--ink-soft); cursor: pointer; }
        .p-tab-activa { background: var(--accent); color: white; border-color: var(--accent); }
        .p-tab-contenido { max-height: 220px; overflow-y: auto; margin-bottom: 6px; }
        .p-item { border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; background: var(--bg); }
        .p-item-titulo { font-weight: 600; font-size: 13.5px; color: var(--ink); text-decoration: none; display: block; }
        .p-item-detalle { font-size: 12.5px; color: var(--ink-soft); margin-top: 3px; }
        .p-tab-borrar { margin-left: 6px; opacity: 0.7; }
        .p-tab-borrar:hover { opacity: 1; }
        .p-tab-nueva { border-style: dashed; }
        .p-admin-form { display: flex; flex-direction: column; gap: 6px; border: 1px dashed var(--line); border-radius: 10px; padding: 10px; margin-bottom: 10px; background: var(--accent-soft); }
        .p-item-borrar { align-self: flex-start; background: none; border: none; color: var(--danger); font-size: 11.5px; cursor: pointer; padding: 4px 0 0; }
        .p-comprar { display: inline-block; margin-top: 6px; font-size: 12.5px; font-weight: 600; color: white; background: #25D366; padding: 5px 10px; border-radius: 6px; text-decoration: none; }
        .p-admin-form select { font-family: 'Inter', sans-serif; font-size: 13px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); }
      `}</style>

      {!session ? (
        <div className="p-card">
          <div className="p-logo">Kajalu</div>
          <p className="p-sub">
            {modo === "login" && "Inicia sesión para agendar y ver tus beneficios."}
            {modo === "registro" && "Regístrate para conocerte mejor y darte un mejor servicio."}
            {modo === "recuperar" && "Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña."}
          </p>

          {error && <div className="p-error">{error}</div>}
          {mensaje && <div className="p-msg">{mensaje}</div>}

          {modo === "registro" && (
            <input placeholder="Tu nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          )}
          <input type="email" placeholder="Correo electrónico" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />

          {modo !== "recuperar" && (
            <>
              <input type="password" placeholder="Contraseña para tu cuenta Kajalu" value={form.clave} onChange={(e) => setForm({ ...form, clave: e.target.value })} />
              {modo === "registro" && (
                <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: -6, marginBottom: 10 }}>
                  Mínimo 6 caracteres, con al menos 1 mayúscula, 1 número y 1 carácter especial (ej: Kajalu2026!). Puede ser diferente a la contraseña de tu correo.
                </p>
              )}
            </>
          )}

          <button
            className="p-btn"
            disabled={cargando}
            onClick={modo === "login" ? iniciarSesion : modo === "registro" ? registrar : recuperarClave}
          >
            {cargando ? "Un momento…" : modo === "login" ? "Iniciar sesión" : modo === "registro" ? "Registrarme" : "Enviar enlace"}
          </button>

          {modo === "login" && (
            <button className="p-link" onClick={() => { setModo("recuperar"); setError(""); setMensaje(""); }}>
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <button className="p-link" onClick={() => { setModo(modo === "registro" ? "login" : "registro"); setError(""); setMensaje(""); }}>
            {modo === "registro" ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
          </button>

          {modo === "recuperar" && (
            <button className="p-link" onClick={() => { setModo("login"); setError(""); setMensaje(""); }}>
              Volver a iniciar sesión
            </button>
          )}
        </div>
      ) : (
        <div className="p-card">
          <div className="p-logo">Kajalu</div>
          <div className="p-title">
            <Sparkles size={16} style={{ verticalAlign: -2 }} /> {mensajeDelDia}
          </div>

          {mensaje && <div className="p-msg">{mensaje}</div>}

          {(!perfilCompleto || mostrarEdicionPerfil) ? (
            <>
              <p className="p-sub">Cuéntanos tus preferencias para darte un servicio hecho a tu medida.</p>
              <input placeholder="Tu nombre" value={perfilForm.nombre} onChange={(e) => setPerfilForm({ ...perfilForm, nombre: e.target.value })} />
              <input placeholder="Teléfono" value={perfilForm.telefono} onChange={(e) => setPerfilForm({ ...perfilForm, telefono: e.target.value })} />
              <textarea className="p-textarea" placeholder="Tus preferencias (ej: tonos, alergias, servicios favoritos...)" value={perfilForm.preferencias} onChange={(e) => setPerfilForm({ ...perfilForm, preferencias: e.target.value })} />

              <button
                className="p-btn"
                disabled={guardando}
                onClick={async () => { await guardarPerfil(); setMostrarEdicionPerfil(false); }}
              >
                {guardando ? "Guardando…" : "Guardar mis datos"}
              </button>
            </>
          ) : (
            <button className="p-link" style={{ marginTop: 0, marginBottom: 6 }} onClick={() => setMostrarEdicionPerfil(true)}>
              Editar mis datos
            </button>
          )}

          <div className="p-title" style={{ fontSize: 16, marginTop: 22 }}>Agenda tu cita</div>
          <p className="p-sub" style={{ marginBottom: 8 }}>Escríbenos qué servicio quieres y cuándo — la asistente arma tu solicitud.</p>
          {errorCita && <div className="p-error">{errorCita}</div>}
          {respuestaCita && <div className="p-msg">{respuestaCita}</div>}
          <textarea
            className="p-textarea"
            placeholder='Ej: "Quiero un masaje relajante el viernes a las 4pm"'
            value={mensajeCita}
            onChange={(e) => setMensajeCita(e.target.value)}
          />
          <button className="p-btn" disabled={enviandoCita} onClick={enviarSolicitudCita}>
            {enviandoCita ? "Enviando…" : "Enviar solicitud"}
          </button>

          <div className="p-title" style={{ fontSize: 16, marginTop: 22 }}>Explora Kajalu</div>
          <div className="p-tabs">
            {contenido.tabs.map((t) => (
              <button
                key={t.id}
                className={`p-tab ${tabActiva === t.id ? "p-tab-activa" : ""}`}
                onClick={() => setTabActiva(t.id)}
              >
                {t.label}
                {esAdmin && (
                  <span
                    className="p-tab-borrar"
                    onClick={(e) => { e.stopPropagation(); eliminarPestaña(t.id); }}
                    title="Eliminar pestaña"
                  > ×</span>
                )}
              </button>
            ))}
            {esAdmin && (
              <button className="p-tab p-tab-nueva" onClick={() => setMostrandoFormPestaña(!mostrandoFormPestaña)}>
                + Nueva
              </button>
            )}
          </div>

          {esAdmin && mostrandoFormPestaña && (
            <div className="p-admin-form">
              <input
                placeholder="Nombre de la pestaña (ej: Videos)"
                value={nuevaPestañaNombre}
                onChange={(e) => setNuevaPestañaNombre(e.target.value)}
              />
              <select value={nuevaPestañaTipo} onChange={(e) => setNuevaPestañaTipo(e.target.value)}>
                <option value="info">Normal (solo tú agregas contenido)</option>
                <option value="catalogo">Catálogo (con botón "Quiero comprarlo")</option>
                <option value="resenas">Reseñas (las clientas pueden escribir)</option>
              </select>
              <button className="p-btn" onClick={agregarPestaña}>Crear pestaña</button>
            </div>
          )}

          <div className="p-tab-contenido">
            {contenido.tabs
              .find((t) => t.id === tabActiva)
              ?.items.map((item, i) => {
                const tabActual = contenido.tabs.find((t) => t.id === tabActiva);
                const waLink = `https://wa.me/573145390510?text=${encodeURIComponent("Hola, quiero comprar: " + item.titulo)}`;
                return (
                  <div className="p-item" key={i}>
                    <div className="p-item-titulo">{item.titulo}</div>
                    {item.detalle && <div className="p-item-detalle">{item.detalle}</div>}
                    {tabActual?.tipo === "catalogo" && (
                      <a className="p-comprar" href={waLink} target="_blank" rel="noopener noreferrer">
                        Quiero comprarlo
                      </a>
                    )}
                    {esAdmin && (
                      <button className="p-item-borrar" onClick={() => eliminarItem(i)}>Eliminar</button>
                    )}
                  </div>
                );
              })}
            {(!contenido.tabs.find((t) => t.id === tabActiva)?.items.length) && (
              <p className="p-sub" style={{ margin: 0 }}>Todavía no hay contenido aquí.</p>
            )}
          </div>

          {contenido.tabs.find((t) => t.id === tabActiva)?.tipo === "resenas" && (
            <div className="p-admin-form">
              <textarea
                className="p-textarea"
                placeholder="Cuéntanos cómo fue tu experiencia..."
                value={textoResena}
                onChange={(e) => setTextoResena(e.target.value)}
              />
              <button className="p-btn" onClick={publicarResena}>Publicar mi reseña</button>
            </div>
          )}

          {esAdmin && (
            <div className="p-admin-form">
              <input
                placeholder="Título (ej: Manicure spa — $35.000)"
                value={nuevoItem.titulo}
                onChange={(e) => setNuevoItem({ ...nuevoItem, titulo: e.target.value })}
              />
              <input
                placeholder="Detalle (opcional)"
                value={nuevoItem.detalle}
                onChange={(e) => setNuevoItem({ ...nuevoItem, detalle: e.target.value })}
              />
              <button className="p-btn" onClick={agregarItem}>Agregar a "{contenido.tabs.find((t) => t.id === tabActiva)?.label}"</button>
            </div>
          )}

          <button className="p-signout" onClick={cerrarSesion}><LogOut size={13} />Cerrar sesión</button>
        </div>
      )}

      <a
        href="https://wa.me/573145390510?text=Hola%2C%20quiero%20agendar%20una%20cita%20con%20Kajalu%20Stetic"
        target="_blank"
        rel="noopener noreferrer"
        title="Escríbenos por WhatsApp"
        style={{
          position: "fixed", bottom: 24, right: 24, width: 54, height: 54,
          background: "#25D366", borderRadius: "50%", display: "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 14px rgba(0,0,0,0.28)", zIndex: 999,
        }}
      >
        <MessageCircle size={26} color="white" />
      </a>
    </div>
  );
}
