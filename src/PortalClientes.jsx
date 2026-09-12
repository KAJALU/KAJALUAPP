import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Sparkles, LogOut, MessageCircle } from "lucide-react";

export default function PortalClientes() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [modo, setModo] = useState("login"); // "login" | "registro"
  const [form, setForm] = useState({ nombre: "", correo: "", clave: "" });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [perfil, setPerfil] = useState(null);
  const [perfilForm, setPerfilForm] = useState({ nombre: "", telefono: "", preferencias: "" });
  const [guardando, setGuardando] = useState(false);

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

  const registrar = async () => {
    setError(""); setMensaje(""); setCargando(true);
    const { error } = await supabase.auth.signUp({
      email: form.correo,
      password: form.clave,
      options: { data: { nombre: form.nombre } },
    });
    setCargando(false);
    if (error) setError(error.message);
    else setMensaje("¡Cuenta creada! Revisa tu correo para confirmar (si aplica) y luego inicia sesión.");
  };

  const iniciarSesion = async () => {
    setError(""); setMensaje(""); setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: form.correo, password: form.clave });
    setCargando(false);
    if (error) setError(error.message);
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
  };

  const guardarPerfil = async () => {
    setGuardando(true);
    await supabase.from("perfiles_clientes").update(perfilForm).eq("id", session.user.id);
    setGuardando(false);
    setMensaje("Datos actualizados. ¡Gracias por contarnos más sobre ti!");
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
        .p-card { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 32px; width: 100%; max-width: 380px; }
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
      `}</style>

      {!session ? (
        <div className="p-card">
          <div className="p-logo">Kajalu</div>
          <p className="p-sub">{modo === "login" ? "Inicia sesión para agendar y ver tus beneficios." : "Regístrate para conocerte mejor y darte un mejor servicio."}</p>

          {error && <div className="p-error">{error}</div>}
          {mensaje && <div className="p-msg">{mensaje}</div>}

          {modo === "registro" && (
            <input placeholder="Tu nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          )}
          <input type="email" placeholder="Correo electrónico" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
          <input type="password" placeholder="Contraseña" value={form.clave} onChange={(e) => setForm({ ...form, clave: e.target.value })} />

          <button className="p-btn" disabled={cargando} onClick={modo === "login" ? iniciarSesion : registrar}>
            {cargando ? "Un momento…" : modo === "login" ? "Iniciar sesión" : "Registrarme"}
          </button>

          <button className="p-link" onClick={() => { setModo(modo === "login" ? "registro" : "login"); setError(""); setMensaje(""); }}>
            {modo === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </div>
      ) : (
        <div className="p-card">
          <div className="p-logo">Kajalu</div>
          <div className="p-title">Hola, {perfilForm.nombre || "bienvenida"} <Sparkles size={16} style={{ verticalAlign: -2 }} /></div>
          <p className="p-sub">Cuéntanos tus preferencias para darte un servicio hecho a tu medida.</p>

          {mensaje && <div className="p-msg">{mensaje}</div>}

          <input placeholder="Tu nombre" value={perfilForm.nombre} onChange={(e) => setPerfilForm({ ...perfilForm, nombre: e.target.value })} />
          <input placeholder="Teléfono" value={perfilForm.telefono} onChange={(e) => setPerfilForm({ ...perfilForm, telefono: e.target.value })} />
          <textarea className="p-textarea" placeholder="Tus preferencias (ej: tonos, alergias, servicios favoritos...)" value={perfilForm.preferencias} onChange={(e) => setPerfilForm({ ...perfilForm, preferencias: e.target.value })} />

          <button className="p-btn" disabled={guardando} onClick={guardarPerfil}>
            {guardando ? "Guardando…" : "Guardar mis datos"}
          </button>

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
