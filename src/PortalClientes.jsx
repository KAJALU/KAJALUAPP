import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Sparkles, LogOut, MessageCircle, Home, Calendar, User, Star, ShoppingBag, Tag, Menu, X } from "lucide-react";

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
  const [nuevoItem, setNuevoItem] = useState({ titulo: "", detalle: "", imagenUrl: "" });
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [nuevaPestañaNombre, setNuevaPestañaNombre] = useState("");
  const [nuevaPestañaTipo, setNuevaPestañaTipo] = useState("info");
  const [mostrandoFormPestaña, setMostrandoFormPestaña] = useState(false);
  const [textoResena, setTextoResena] = useState("");
  const [servicios, setServicios] = useState([]);
  // La administración del contenido (agregar/quitar pestañas, fotos, etc.) ahora se hace
  // exclusivamente desde el panel de administrador (App.jsx) — aquí el portal es solo para clientas.
  const esAdmin = false;

  const [mensajeDelDia, setMensajeDelDia] = useState("¡Bienvenida a Kajalu!");
  const [vista, setVista] = useState("inicio"); // "inicio" | "citas" | "perfil" | id de una pestaña
  const [menuAbierto, setMenuAbierto] = useState(false);

  const iconoDePestaña = (tipo) => (tipo === "catalogo" ? ShoppingBag : tipo === "resenas" ? Star : Tag);
  const irA = (v) => { setVista(v); setMenuAbierto(false); };

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
      if (fila?.data?.servicios) setServicios(fila.data.servicios);

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

  const subirImagen = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setSubiendoImagen(true);
    try {
      const nombreArchivo = `${Date.now()}_${archivo.name}`;
      const { error } = await supabase.storage.from("kajalu-fotos").upload(nombreArchivo, archivo);
      if (error) throw error;
      const { data } = supabase.storage.from("kajalu-fotos").getPublicUrl(nombreArchivo);
      setNuevoItem((prev) => ({ ...prev, imagenUrl: data.publicUrl }));
    } catch (err) {
      console.error("Error subiendo la imagen:", err);
      alert("No se pudo subir la foto. Intenta de nuevo.");
    } finally {
      setSubiendoImagen(false);
    }
  };

  const agregarItem = async () => {
    if (!nuevoItem.titulo.trim()) return;
    const nuevasTabs = contenido.tabs.map((t) =>
      t.id === tabActiva ? { ...t, items: [...t.items, { ...nuevoItem }] } : t
    );
    await guardarContenido({ ...contenido, tabs: nuevasTabs });
    setNuevoItem({ titulo: "", detalle: "", imagenUrl: "" });
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

  const sincronizarClienteAdmin = async (nombre, telefono, notas) => {
    const { data: fila } = await supabase.from("app_data").select("data").eq("id", "main").maybeSingle();
    const actual = fila?.data || {};
    const clientesActuales = actual.clientes || [];
    const idx = clientesActuales.findIndex((c) => c.clienteId === session.user.id);
    let nuevosClientes;
    if (idx >= 0) {
      nuevosClientes = clientesActuales.map((c, i) => (i === idx ? { ...c, nombre, telefono, notas } : c));
    } else {
      nuevosClientes = [
        ...clientesActuales,
        { id: Math.random().toString(36).slice(2, 9), clienteId: session.user.id, nombre, telefono, notas },
      ];
    }
    await supabase.from("app_data").upsert({
      id: "main",
      data: { ...actual, clientes: nuevosClientes },
      updated_at: new Date().toISOString(),
    });
  };

  const guardarPerfil = async () => {
    setGuardando(true);
    await supabase.from("perfiles_clientes").update(perfilForm).eq("id", session.user.id);
    setPerfil({ ...(perfil || {}), ...perfilForm });
    await sincronizarClienteAdmin(perfilForm.nombre, perfilForm.telefono, perfilForm.preferencias);
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
        .p-item-img { width: 100%; max-height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 6px; display: block; }

        /* --- Layout tipo panel para clientas con sesión iniciada --- */
        .k-app { width: 100%; max-width: 1100px; min-height: 80vh; display: flex; background: var(--bg); border-radius: 14px; overflow: hidden; box-shadow: 0 2px 24px rgba(0,0,0,0.06); }
        .k-sidebar { width: 220px; flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--line); padding: 24px 0; display: flex; flex-direction: column; }
        .k-nav { display: flex; flex-direction: column; gap: 2px; margin-top: 18px; flex: 1; }
        .k-nav-item { display: flex; align-items: center; gap: 10px; text-align: left; background: none; border: none; font-family: 'Inter', sans-serif; font-size: 13.5px; color: var(--ink-soft); padding: 10px 20px; cursor: pointer; }
        .k-nav-item:hover { background: var(--bg); }
        .k-nav-activo { background: var(--accent); color: white; font-weight: 600; }
        .k-menu-toggle { display: none; }
        .k-main { flex: 1; padding: 28px 30px; overflow-y: auto; }
        .k-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px; }
        .k-header-icon { background: var(--accent-soft); border-radius: 10px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .k-header h1 { font-family: 'Fraunces', serif; font-size: 21px; margin: 0 0 3px; color: var(--ink); }
        .k-header p { font-size: 13.5px; color: var(--ink-soft); margin: 0; }
        .k-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
        .k-card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 16px; cursor: pointer; }
        .k-card:hover { border-color: var(--accent); }
        .k-card-titulo { display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 14px; color: var(--ink); margin-bottom: 4px; }
        .k-panel { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 18px; margin-top: 16px; }
        .k-tab-encabezado { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        @media (max-width: 760px) {
          .p-root { padding: 0; align-items: stretch; }
          .k-app { border-radius: 0; min-height: 100vh; }
          .k-menu-toggle { display: flex; position: fixed; top: 14px; left: 14px; z-index: 1000; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; width: 38px; height: 38px; align-items: center; justify-content: center; cursor: pointer; }
          .k-sidebar { position: fixed; top: 0; left: -240px; height: 100vh; z-index: 999; transition: left 0.2s ease; padding-top: 60px; }
          .k-sidebar-abierto { left: 0; }
          .k-main { padding: 60px 16px 24px; }
          .k-grid { grid-template-columns: 1fr; }
        }
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
        <div className="k-app">
          <button className="k-menu-toggle" onClick={() => setMenuAbierto(!menuAbierto)}>
            {menuAbierto ? <X size={20} /> : <Menu size={20} />}
          </button>

          <aside className={`k-sidebar ${menuAbierto ? "k-sidebar-abierto" : ""}`}>
            <div className="p-logo" style={{ padding: "0 20px" }}>Kajalu</div>
            <nav className="k-nav">
              <button className={`k-nav-item ${vista === "inicio" ? "k-nav-activo" : ""}`} onClick={() => irA("inicio")}>
                <Home size={17} /> Inicio
              </button>
              <button className={`k-nav-item ${vista === "citas" ? "k-nav-activo" : ""}`} onClick={() => irA("citas")}>
                <Calendar size={17} /> Agendar cita
              </button>
              <button className={`k-nav-item ${vista === "precios" ? "k-nav-activo" : ""}`} onClick={() => irA("precios")}>
                <Tag size={17} /> Lista de precios
              </button>
              {contenido.tabs
                .filter((t) => t.id !== "fotosvideos")
                .map((t) => {
                  const Icono = iconoDePestaña(t.tipo);
                  return (
                    <button key={t.id} className={`k-nav-item ${vista === t.id ? "k-nav-activo" : ""}`} onClick={() => irA(t.id)}>
                      <Icono size={17} /> {t.label}
                    </button>
                  );
                })}
              <button className={`k-nav-item ${vista === "perfil" ? "k-nav-activo" : ""}`} onClick={() => irA("perfil")}>
                <User size={17} /> Mi perfil
              </button>
            </nav>
            <button className="p-signout" style={{ margin: "12px 20px" }} onClick={cerrarSesion}>
              <LogOut size={13} />Cerrar sesión
            </button>
          </aside>

          <main className="k-main">
            <header className="k-header">
              <div className="k-header-icon"><Sparkles size={20} color="var(--accent)" /></div>
              <div>
                <h1>Hola, {perfilForm.nombre || "bienvenida"}</h1>
                <p>{mensajeDelDia}</p>
              </div>
            </header>

            {mensaje && <div className="p-msg">{mensaje}</div>}

            {vista === "inicio" && (
              <>
                <div className="k-grid">
                  <div className="k-card" onClick={() => irA("citas")} role="button">
                    <div className="k-card-titulo"><Calendar size={16} /> Agenda tu cita</div>
                    <p className="p-sub" style={{ margin: 0 }}>Escríbenos qué servicio quieres y cuándo.</p>
                  </div>
                  {contenido.tabs
                    .filter((t) => t.id !== "fotosvideos")
                    .slice(0, 3)
                    .map((t) => {
                      const Icono = iconoDePestaña(t.tipo);
                      return (
                        <div className="k-card" key={t.id} onClick={() => irA(t.id)} role="button">
                          <div className="k-card-titulo"><Icono size={16} /> {t.label}</div>
                          <p className="p-sub" style={{ margin: 0 }}>
                            {t.items.length > 0 ? t.items[t.items.length - 1].titulo : "Todavía no hay contenido aquí."}
                          </p>
                        </div>
                      );
                    })}
                </div>

                {contenido.tabs.find((t) => t.id === "fotosvideos")?.items.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div className="p-title" style={{ fontSize: 16, marginBottom: 10 }}>Novedades</div>
                    <div className="k-grid">
                      {contenido.tabs
                        .find((t) => t.id === "fotosvideos")
                        .items.slice()
                        .reverse()
                        .map((item, i) => (
                          <div className="p-item" key={i}>
                            {item.tipoMedia === "video" ? (
                              <video src={item.imagenUrl} controls className="p-item-img" />
                            ) : (
                              <img src={item.imagenUrl} alt={item.titulo} className="p-item-img" />
                            )}
                            <div className="p-item-titulo">{item.titulo}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {vista === "citas" && (
              <div className="k-panel">
                <div className="p-title" style={{ fontSize: 16 }}>Agenda tu cita</div>
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
              </div>
            )}

            {vista === "precios" && (
              <div className="k-panel">
                <div className="p-title" style={{ fontSize: 16, marginBottom: 10 }}>Lista de precios</div>
                {servicios.length === 0 && (
                  <p className="p-sub" style={{ margin: 0 }}>Todavía no hay servicios publicados.</p>
                )}
                {Object.entries(
                  servicios.reduce((acc, s) => {
                    const cat = s.categoria || "Otros";
                    (acc[cat] = acc[cat] || []).push(s);
                    return acc;
                  }, {})
                ).map(([cat, lista]) => (
                  <div key={cat} style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 6, color: "var(--accent)" }}>{cat}</div>
                    {lista.map((s) => (
                      <div className="p-item" key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div className="p-item-titulo">{s.nombre}</div>
                          {s.duracion && <div className="p-item-detalle">{s.duracion}</div>}
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          {s.precio ? `$${Number(s.precio).toLocaleString("es-CO")}` : "Consultar"}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {vista === "perfil" && (
              <div className="k-panel">
                <div className="p-title" style={{ fontSize: 16 }}>Mi perfil</div>
                <p className="p-sub">Cuéntanos tus preferencias para darte un servicio hecho a tu medida.</p>
                <input placeholder="Tu nombre" value={perfilForm.nombre} onChange={(e) => setPerfilForm({ ...perfilForm, nombre: e.target.value })} />
                <input placeholder="Teléfono" value={perfilForm.telefono} onChange={(e) => setPerfilForm({ ...perfilForm, telefono: e.target.value })} />
                <textarea className="p-textarea" placeholder="Tus preferencias (ej: tonos, alergias, servicios favoritos...)" value={perfilForm.preferencias} onChange={(e) => setPerfilForm({ ...perfilForm, preferencias: e.target.value })} />
                <button className="p-btn" disabled={guardando} onClick={guardarPerfil}>
                  {guardando ? "Guardando…" : "Guardar mis datos"}
                </button>
              </div>
            )}

            {contenido.tabs.some((t) => t.id === vista) && (
              <div className="k-panel">
                <div className="k-tab-encabezado">
                  <div className="p-title" style={{ fontSize: 16, margin: 0 }}>
                    {contenido.tabs.find((t) => t.id === vista)?.label}
                  </div>
                  {esAdmin && (
                    <button className="p-link" style={{ margin: 0, width: "auto" }} onClick={() => eliminarPestaña(vista)}>
                      Eliminar esta pestaña
                    </button>
                  )}
                </div>

                <div className="k-grid">
                  {contenido.tabs
                    .find((t) => t.id === vista)
                    ?.items.map((item, i) => {
                      const tabActual = contenido.tabs.find((t) => t.id === vista);
                      const waLink = `https://wa.me/573145390510?text=${encodeURIComponent("Hola, quiero comprar: " + item.titulo)}`;
                      return (
                        <div className="p-item" key={i}>
                          {item.imagenUrl && item.tipoMedia === "video" ? (
                            <video src={item.imagenUrl} controls className="p-item-img" />
                          ) : (
                            item.imagenUrl && <img src={item.imagenUrl} alt={item.titulo} className="p-item-img" />
                          )}
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
                </div>
                {(!contenido.tabs.find((t) => t.id === vista)?.items.length) && (
                  <p className="p-sub" style={{ margin: 0 }}>Todavía no hay contenido aquí.</p>
                )}

                {contenido.tabs.find((t) => t.id === vista)?.tipo === "resenas" && (
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
                    <input type="file" accept="image/*" onChange={subirImagen} disabled={subiendoImagen} />
                    {subiendoImagen && <span className="p-sub" style={{ margin: 0 }}>Subiendo foto…</span>}
                    {nuevoItem.imagenUrl && <img src={nuevoItem.imagenUrl} alt="vista previa" className="p-item-img" />}
                    <button className="p-btn" disabled={subiendoImagen} onClick={agregarItem}>
                      Agregar a "{contenido.tabs.find((t) => t.id === vista)?.label}"
                    </button>
                  </div>
                )}
              </div>
            )}

            {esAdmin && (
              <div className="k-panel">
                <div className="p-title" style={{ fontSize: 16 }}>Crear una nueva pestaña</div>
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
          </main>
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
