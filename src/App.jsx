import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  Home, CalendarCheck, Users, Package, Wallet, CheckSquare, BellRing,
  MessageCircle, Sparkles, Plus, Trash2, Phone, AlertTriangle,
  TrendingUp, TrendingDown, ShoppingCart, ChevronRight, Sun,
  Tag, Star, Megaphone, Bot, Loader2, CheckCircle2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ---------- helpers ----------
const uid = () => Math.random().toString(36).slice(2, 9);
const todayD = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (base, n) => {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return iso(d);
};
const todayISO = iso(todayD);
const monthKey = (dateStr) => dateStr.slice(0, 7);
const monthLabel = (key) => {
  const [y, m] = key.split("-");
  const names = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${names[parseInt(m, 10) - 1]} ${y.slice(2)}`;
};
const money = (n) => "$" + Number(n || 0).toLocaleString("es-CO");
const STORAGE_KEY = "kajaluapp-data";

// ---------- seed data ----------
const seedClientes = [
  { id: uid(), nombre: "Marcela Ríos", telefono: "300 555 1122", notas: "Prefiere tonos nude", },
  { id: uid(), nombre: "Daniela Ospina", telefono: "312 444 8890", notas: "Alergia al amoníaco", },
  { id: uid(), nombre: "Valentina Cano", telefono: "301 222 3344", notas: "Cliente frecuente, cumpleaños en octubre", },
];

const seedCitas = [
  { id: uid(), cliente: "Marcela Ríos", servicio: "Manicure semipermanente", fecha: todayISO, hora: "10:00", precio: 45000, estado: "confirmada" },
  { id: uid(), cliente: "Daniela Ospina", servicio: "Corte + tratamiento capilar", fecha: todayISO, hora: "15:30", precio: 90000, estado: "pendiente" },
  { id: uid(), cliente: "Valentina Cano", servicio: "Maquillaje social", fecha: addDays(todayISO, 1), hora: "17:00", precio: 120000, estado: "confirmada" },
  { id: uid(), cliente: "Marcela Ríos", servicio: "Pedicure spa", fecha: addDays(todayISO, -6), hora: "11:00", precio: 55000, estado: "completada" },
  { id: uid(), cliente: "Daniela Ospina", servicio: "Manicure clásica", fecha: addDays(todayISO, -20), hora: "09:30", precio: 35000, estado: "completada" },
];

const seedProductos = [
  { id: uid(), nombre: "Esmalte semipermanente rojo", categoria: "Uñas", precio: 28000, stock: 4, minimo: 3 },
  { id: uid(), nombre: "Kit de pinceles maquillaje", categoria: "Maquillaje", precio: 65000, stock: 6, minimo: 2 },
  { id: uid(), nombre: "Ampolla capilar reparadora", categoria: "Cabello", precio: 15000, stock: 2, minimo: 5 },
  { id: uid(), nombre: "Aceite de cutícula", categoria: "Uñas", precio: 12000, stock: 9, minimo: 4 },
];

const seedCompras = [
  { id: uid(), item: "Ampolla capilar reparadora", proveedor: "Distribuidora Bell", cantidad: 10, costo: 90000, fecha: addDays(todayISO, -2), estado: "pendiente" },
  { id: uid(), item: "Base líquida tono medio", proveedor: "Cosmética Andina", cantidad: 5, costo: 110000, fecha: addDays(todayISO, -1), estado: "recibida" },
];

const seedGastos = [
  { id: uid(), concepto: "Arriendo local", categoria: "Fijo", monto: 800000, fecha: addDays(todayISO, -5) },
  { id: uid(), concepto: "Servicios públicos", categoria: "Fijo", monto: 180000, fecha: addDays(todayISO, -4) },
  { id: uid(), concepto: "Insumos de uñas", categoria: "Variable", monto: 95000, fecha: addDays(todayISO, -33) },
];

const seedVentas = [
  { id: uid(), concepto: "Venta kit de pinceles", monto: 65000, fecha: addDays(todayISO, -3) },
  { id: uid(), concepto: "Venta aceite de cutícula x2", monto: 24000, fecha: addDays(todayISO, -35) },
];

const seedTareas = [
  { id: uid(), texto: "Confirmar cita de mañana con Valentina", hecha: false },
  { id: uid(), texto: "Publicar tip de belleza de la semana", hecha: false },
  { id: uid(), texto: "Pedir más ampolla capilar", hecha: true },
];

const seedNotas = [
  { id: uid(), texto: "Preguntar a clientas si prefieren recordatorio por WhatsApp o llamada." },
];

const seedRecordatorios = [
  { id: uid(), texto: "Oferta 2x1 en manicure semipermanente", fecha: addDays(todayISO, 2), tipo: "oferta" },
  { id: uid(), texto: "Renovar licencia de funcionamiento", fecha: addDays(todayISO, 10), tipo: "general" },
];

const seedTips = [
  { id: uid(), titulo: "Hidratación antes de esmaltar", texto: "Aplica aceite de cutícula 24h antes del esmaltado para que dure más.", categoria: "Uñas" },
  { id: uid(), titulo: "Protege el color", texto: "Usa champú sin sulfatos para que el tinte no pierda intensidad.", categoria: "Cabello" },
];

const seedPlantillas = [
  { id: uid(), palabra: "precio", respuesta: "¡Hola! Gracias por escribir 💕 Te cuento los precios de nuestros servicios en un momento." },
  { id: uid(), palabra: "cita", respuesta: "Claro que sí, cuéntame qué servicio te interesa y el día que prefieres para agendar tu cita." },
  { id: uid(), palabra: "horario", respuesta: "Atendemos de martes a sábado de 9:00 a.m. a 6:00 p.m." },
];

const seedServicios = [
  { id: uid(), nombre: "Masaje reductor", categoria: "Masajes", precio: 85000, duracion: "50 min" },
  { id: uid(), nombre: "Masaje relajante", categoria: "Masajes", precio: 70000, duracion: "45 min" },
  { id: uid(), nombre: "Manicure clásica", categoria: "Uñas", precio: 35000, duracion: "40 min" },
  { id: uid(), nombre: "Manicure semipermanente", categoria: "Uñas", precio: 45000, duracion: "50 min" },
  { id: uid(), nombre: "Pedicure spa", categoria: "Uñas", precio: 55000, duracion: "60 min" },
  { id: uid(), nombre: "Corte + tratamiento capilar", categoria: "Cabello", precio: 90000, duracion: "70 min" },
  { id: uid(), nombre: "Maquillaje social", categoria: "Maquillaje", precio: 120000, duracion: "60 min" },
];

const seedResenas = [
  { id: uid(), cliente: "Valentina Cano", calificacion: 5, comentario: "Excelente atención, el maquillaje me duró toda la noche.", fecha: addDays(todayISO, -6) },
  { id: uid(), cliente: "Marcela Ríos", calificacion: 4, comentario: "Muy buen servicio, aunque tuve que esperar un poco.", fecha: addDays(todayISO, -15) },
];

const seedPautas = [
  { id: uid(), titulo: "Combo de verano: masaje reductor + exfoliación", categoria: "Masajes reductores", texto: "Recupera tu figura para la temporada con nuestro combo especial. Cupos limitados, agenda ya." },
  { id: uid(), titulo: "Manos perfectas para el fin de semana", categoria: "Manicura", texto: "Semipermanente + spa de manos con 15% de descuento reservando entre semana." },
];

// ---------- small UI atoms ----------
function Card({ children, style }) {
  return <div className="k-card" style={style}>{children}</div>;
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="k-section-header">
      <div className="k-section-icon">{icon}</div>
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="k-empty">{text}</div>;
}

function IconBtn({ onClick, title, danger, children }) {
  return (
    <button className={"k-iconbtn" + (danger ? " danger" : "")} onClick={onClick} title={title}>
      {children}
    </button>
  );
}

// ---------- App ----------
export default function App() {
  const [activeTab, setActiveTab] = useState("inicio");

  const [clientes, setClientes] = useState(seedClientes);
  const [citas, setCitas] = useState(seedCitas);
  const [productos, setProductos] = useState(seedProductos);
  const [compras, setCompras] = useState(seedCompras);
  const [gastos, setGastos] = useState(seedGastos);
  const [ventas, setVentas] = useState(seedVentas);
  const [tareas, setTareas] = useState(seedTareas);
  const [notas, setNotas] = useState(seedNotas);
  const [recordatorios, setRecordatorios] = useState(seedRecordatorios);
  const [tips, setTips] = useState(seedTips);
  const [plantillas, setPlantillas] = useState(seedPlantillas);
  const [servicios, setServicios] = useState(seedServicios);
  const [resenas, setResenas] = useState(seedResenas);
  const [pautas, setPautas] = useState(seedPautas);
  const [perfilesIA, setPerfilesIA] = useState([]);
  const [sugerenciasIA, setSugerenciasIA] = useState([]);

  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Cargar datos guardados al abrir la app (desde Supabase)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: row, error } = await supabase
          .from("app_data")
          .select("data")
          .eq("id", "main")
          .maybeSingle();
        if (error) throw error;
        if (!cancelled && row && row.data) {
          const data = row.data;
          if (data.clientes) setClientes(data.clientes);
          if (data.citas) setCitas(data.citas);
          if (data.productos) setProductos(data.productos);
          if (data.compras) setCompras(data.compras);
          if (data.gastos) setGastos(data.gastos);
          if (data.ventas) setVentas(data.ventas);
          if (data.tareas) setTareas(data.tareas);
          if (data.notas) setNotas(data.notas);
          if (data.recordatorios) setRecordatorios(data.recordatorios);
          if (data.tips) setTips(data.tips);
          if (data.plantillas) setPlantillas(data.plantillas);
          if (data.servicios) setServicios(data.servicios);
          if (data.resenas) setResenas(data.resenas);
          if (data.pautas) setPautas(data.pautas);
          if (data.perfilesIA) setPerfilesIA(data.perfilesIA);
          if (data.sugerenciasIA) setSugerenciasIA(data.sugerenciasIA);
        }
      } catch (e) {
        // Aún no hay datos guardados: se usan los datos de ejemplo
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Guardar automáticamente en Supabase cada vez que algo cambia
  useEffect(() => {
    if (!loaded) return;
    const data = { clientes, citas, productos, compras, gastos, ventas, tareas, notas, recordatorios, tips, plantillas, servicios, resenas, pautas, perfilesIA, sugerenciasIA };
    supabase
      .from("app_data")
      .upsert({ id: "main", data, updated_at: new Date().toISOString() })
      .then(({ error }) => setSaveError(!!error));
  }, [loaded, clientes, citas, productos, compras, gastos, ventas, tareas, notas, recordatorios, tips, plantillas, servicios, resenas, pautas, perfilesIA, sugerenciasIA]);

  const tabs = [
    { id: "inicio", label: "Inicio", icon: <Home size={18} /> },
    { id: "citas", label: "Citas", icon: <CalendarCheck size={18} /> },
    { id: "clientes", label: "Clientes", icon: <Users size={18} /> },
    { id: "servicios", label: "Servicios y precios", icon: <Tag size={18} /> },
    { id: "catalogo", label: "Catálogo", icon: <Package size={18} /> },
    { id: "finanzas", label: "Finanzas", icon: <Wallet size={18} /> },
    { id: "resenas", label: "Reseñas", icon: <Star size={18} /> },
    { id: "tareas", label: "Tareas y notas", icon: <CheckSquare size={18} /> },
    { id: "recordatorios", label: "Recordatorios", icon: <BellRing size={18} /> },
    { id: "mensajes", label: "Mensajes", icon: <MessageCircle size={18} /> },
    { id: "pautas", label: "Pautas y promos", icon: <Megaphone size={18} /> },
    { id: "tips", label: "Tips de belleza", icon: <Sparkles size={18} /> },
    { id: "ia", label: "Asistente IA", icon: <Bot size={18} /> },
  ];

  // ----- derived data -----
  const citasHoy = citas.filter((c) => c.fecha === todayISO).sort((a, b) => a.hora.localeCompare(b.hora));
  const stockBajo = productos.filter((p) => p.stock <= p.minimo);
  const ofertasProximas = recordatorios
    .filter((r) => r.tipo === "oferta" && r.fecha >= todayISO)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const ingresosTransacciones = useMemo(() => {
    const deCitas = citas
      .filter((c) => c.estado === "completada")
      .map((c) => ({ monto: c.precio, fecha: c.fecha }));
    const deVentas = ventas.map((v) => ({ monto: v.monto, fecha: v.fecha }));
    return [...deCitas, ...deVentas];
  }, [citas, ventas]);

  const totalIngresosMes = ingresosTransacciones
    .filter((t) => monthKey(t.fecha) === monthKey(todayISO))
    .reduce((s, t) => s + t.monto, 0);
  const totalGastosMes = gastos
    .filter((g) => monthKey(g.fecha) === monthKey(todayISO))
    .reduce((s, g) => s + g.monto, 0);
  const balanceMes = totalIngresosMes - totalGastosMes;

  const chartData = useMemo(() => {
    const map = {};
    ingresosTransacciones.forEach((t) => {
      const k = monthKey(t.fecha);
      map[k] = map[k] || { mes: k, ingresos: 0, gastos: 0 };
      map[k].ingresos += t.monto;
    });
    gastos.forEach((g) => {
      const k = monthKey(g.fecha);
      map[k] = map[k] || { mes: k, ingresos: 0, gastos: 0 };
      map[k].gastos += g.monto;
    });
    return Object.values(map)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .map((r) => ({ ...r, label: monthLabel(r.mes) }));
  }, [ingresosTransacciones, gastos]);

  // ----- mutators -----
  const cycleEstadoCita = (id) =>
    setCitas((cs) =>
      cs.map((c) => {
        if (c.id !== id) return c;
        const next = { pendiente: "confirmada", confirmada: "completada", completada: "pendiente" }[c.estado];
        return { ...c, estado: next };
      })
    );

  const marcarCompra = (id) =>
    setCompras((prev) =>
      prev.map((c) => {
        if (c.id !== id || c.estado === "recibida") return c;
        setProductos((ps) => {
          const match = ps.find((p) => p.nombre.toLowerCase() === c.item.toLowerCase());
          if (!match) return ps;
          return ps.map((p) => (p.id === match.id ? { ...p, stock: p.stock + c.cantidad } : p));
        });
        return { ...c, estado: "recibida" };
      })
    );

  if (!loaded) {
    return (
      <div style={{
        fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center",
        justifyContent: "center", minHeight: 300, color: "#7A6870", fontSize: 14,
      }}>
        Cargando tu información de Kajalu…
      </div>
    );
  }

  return (
    <div className="k-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&display=swap');

        .k-root {
          --bg: #FAF6F2;
          --surface: #FFFFFF;
          --surface-alt: #F3E7E1;
          --ink: #2A1E24;
          --ink-soft: #7A6870;
          --accent: #9C3D57;
          --accent-soft: #F1DCE0;
          --gold: #A87C25;
          --gold-soft: #F3E6C8;
          --success: #4F7A5A;
          --success-soft: #DEE9E1;
          --danger: #B8503F;
          --danger-soft: #F5DED9;
          --line: #E7DAD2;
          font-family: 'Inter', sans-serif;
          color: var(--ink);
          background: var(--bg);
          min-height: 640px;
          display: flex;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--line);
        }
        .k-root * { box-sizing: border-box; }
        .k-root h1, .k-root h2, .k-root h3 { font-family: 'Fraunces', serif; margin: 0; }

        .k-sidebar {
          width: 232px;
          flex-shrink: 0;
          background: var(--surface);
          border-right: 1px solid var(--line);
          display: flex;
          flex-direction: column;
          padding: 22px 14px;
        }
        .k-logo {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 26px;
          color: var(--accent);
          padding: 4px 10px 20px;
        }
        .k-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .k-navitem {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 9px; border: none;
          background: transparent; color: var(--ink-soft);
          font-size: 14px; font-weight: 500; cursor: pointer; text-align: left;
          font-family: 'Inter', sans-serif;
        }
        .k-navitem:hover { background: var(--surface-alt); color: var(--ink); }
        .k-navitem.active { background: var(--accent); color: white; }
        .k-sidebar-footer {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 12px; color: var(--ink-soft); font-size: 12.5px;
          border-top: 1px solid var(--line); margin-top: 8px;
        }

        .k-main { flex: 1; padding: 28px 34px; overflow-y: auto; max-height: 780px; }

        .k-section-header { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 22px; }
        .k-section-icon {
          width: 38px; height: 38px; border-radius: 10px; background: var(--accent-soft);
          color: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .k-section-header h2 { font-size: 22px; font-weight: 600; }
        .k-section-header p { margin: 2px 0 0; color: var(--ink-soft); font-size: 13.5px; }

        .k-card {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: 12px; padding: 18px 20px; margin-bottom: 16px;
        }
        .k-card h3 { font-size: 15.5px; font-weight: 600; margin-bottom: 12px; }

        .k-grid { display: grid; gap: 16px; }
        .k-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
        .k-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }

        .k-stat { padding: 16px 18px; }
        .k-stat .label { font-size: 12.5px; color: var(--ink-soft); font-weight: 500; }
        .k-stat .value { font-family: 'Fraunces', serif; font-size: 25px; margin-top: 4px; }
        .k-stat .row { display: flex; align-items: center; justify-content: space-between; }

        .k-list-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 0; border-bottom: 1px solid var(--line); gap: 10px;
        }
        .k-list-row:last-child { border-bottom: none; }
        .k-list-row .main { flex: 1; min-width: 0; }
        .k-list-row .title { font-size: 14px; font-weight: 500; }
        .k-list-row .sub { font-size: 12.5px; color: var(--ink-soft); margin-top: 1px; }

        .k-badge {
          font-size: 11.5px; font-weight: 600; padding: 3px 9px; border-radius: 100px;
          white-space: nowrap; text-transform: lowercase;
        }
        .k-badge.pendiente { background: var(--gold-soft); color: var(--gold); }
        .k-badge.confirmada { background: var(--accent-soft); color: var(--accent); }
        .k-badge.completada { background: var(--success-soft); color: var(--success); }
        .k-badge.recibida { background: var(--success-soft); color: var(--success); }
        .k-badge.oferta { background: var(--gold-soft); color: var(--gold); }
        .k-badge.general { background: var(--surface-alt); color: var(--ink-soft); }
        .k-badge.bajo { background: var(--danger-soft); color: var(--danger); }

        .k-form { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }
        .k-form input, .k-form select {
          font-family: 'Inter', sans-serif; font-size: 13.5px; padding: 8px 10px;
          border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink);
          flex: 1; min-width: 120px;
        }
        .k-form input:focus, .k-form select:focus { outline: 2px solid var(--accent); outline-offset: 1px; }

        .k-btn {
          display: flex; align-items: center; gap: 6px; justify-content: center;
          background: var(--accent); color: white; border: none; border-radius: 8px;
          padding: 8px 14px; font-size: 13.5px; font-weight: 600; cursor: pointer;
          font-family: 'Inter', sans-serif; white-space: nowrap;
        }
        .k-btn:hover { opacity: 0.92; }
        .k-btn.ghost { background: transparent; color: var(--accent); border: 1px solid var(--accent-soft); }
        .k-btn:disabled { opacity: 0.7; cursor: default; }
        .k-spin { animation: k-spin-anim 1s linear infinite; }
        @keyframes k-spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .k-iconbtn {
          background: transparent; border: none; color: var(--ink-soft); cursor: pointer;
          padding: 6px; border-radius: 7px; display: flex; align-items: center;
        }
        .k-iconbtn:hover { background: var(--surface-alt); color: var(--ink); }
        .k-iconbtn.danger:hover { background: var(--danger-soft); color: var(--danger); }

        .k-empty { color: var(--ink-soft); font-size: 13.5px; padding: 8px 0; font-style: italic; }

        .k-tipcard {
          background: var(--surface-alt); border-radius: 10px; padding: 14px 16px; margin-bottom: 10px;
        }
        .k-tipcard .cat {
          font-size: 11px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 0.04em;
        }
        .k-tipcard h4 { font-family: 'Fraunces', serif; font-size: 16px; margin: 4px 0 4px; font-weight: 600; }
        .k-tipcard p { font-size: 13.5px; color: var(--ink-soft); margin: 0; }

        .k-checkbox {
          width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid var(--line);
          display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
        }
        .k-checkbox.checked { background: var(--success); border-color: var(--success); color: white; }

        table.k-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        table.k-table th { text-align: left; font-size: 11.5px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.03em; padding: 6px 8px; font-weight: 600; }
        table.k-table td { padding: 9px 8px; border-top: 1px solid var(--line); }

        @media (max-width: 760px) {
          .k-root { flex-direction: column; }
          .k-sidebar { width: 100%; flex-direction: row; align-items: center; overflow-x: auto; padding: 10px 12px; }
          .k-logo { padding: 4px 12px 4px 2px; }
          .k-nav { flex-direction: row; }
          .k-navitem span { display: none; }
          .k-sidebar-footer { display: none; }
          .k-grid.cols-3, .k-grid.cols-2 { grid-template-columns: 1fr; }
          .k-main { padding: 20px; max-height: none; }
        }
      `}</style>

      <aside className="k-sidebar">
        <div className="k-logo">Kajalu</div>
        <nav className="k-nav">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={"k-navitem" + (activeTab === t.id ? " active" : "")}
              onClick={() => setActiveTab(t.id)}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="k-sidebar-footer" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sun size={14} />
            {new Date(todayISO + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long" })}
          </div>
          {saveError && <span style={{ color: "var(--danger)", fontSize: 11.5 }}>No se pudo guardar el último cambio.</span>}
          <button
            className="k-btn ghost"
            style={{ fontSize: 11.5, padding: "5px 10px" }}
            onClick={() => {
              if (!window.confirm("¿Restablecer todos los datos a los de ejemplo? Esto borrará lo que has guardado.")) return;
              setClientes(seedClientes); setCitas(seedCitas); setProductos(seedProductos);
              setCompras(seedCompras); setGastos(seedGastos); setVentas(seedVentas);
              setTareas(seedTareas); setNotas(seedNotas); setRecordatorios(seedRecordatorios);
              setTips(seedTips); setPlantillas(seedPlantillas);
              setServicios(seedServicios); setResenas(seedResenas); setPautas(seedPautas);
              setPerfilesIA([]); setSugerenciasIA([]);
            }}
          >
            Restablecer datos
          </button>
        </div>
      </aside>

      <main className="k-main">
        {activeTab === "inicio" && (
          <Inicio
            citasHoy={citasHoy}
            stockBajo={stockBajo}
            ofertasProximas={ofertasProximas}
            totalIngresosMes={totalIngresosMes}
            totalGastosMes={totalGastosMes}
            balanceMes={balanceMes}
            tareasPendientes={tareas.filter((t) => !t.hecha)}
          />
        )}
        {activeTab === "citas" && (
          <Citas citas={citas} setCitas={setCitas} clientes={clientes} cycleEstadoCita={cycleEstadoCita} />
        )}
        {activeTab === "clientes" && <Clientes clientes={clientes} setClientes={setClientes} citas={citas} />}
        {activeTab === "servicios" && <Servicios servicios={servicios} setServicios={setServicios} />}
        {activeTab === "catalogo" && (
          <Catalogo
            productos={productos}
            setProductos={setProductos}
            compras={compras}
            setCompras={setCompras}
            marcarCompra={marcarCompra}
          />
        )}
        {activeTab === "finanzas" && (
          <Finanzas
            gastos={gastos}
            setGastos={setGastos}
            ventas={ventas}
            setVentas={setVentas}
            totalIngresosMes={totalIngresosMes}
            totalGastosMes={totalGastosMes}
            balanceMes={balanceMes}
            chartData={chartData}
          />
        )}
        {activeTab === "tareas" && (
          <TareasNotas tareas={tareas} setTareas={setTareas} notas={notas} setNotas={setNotas} />
        )}
        {activeTab === "resenas" && <Resenas resenas={resenas} setResenas={setResenas} clientes={clientes} />}
        {activeTab === "recordatorios" && (
          <Recordatorios recordatorios={recordatorios} setRecordatorios={setRecordatorios} />
        )}
        {activeTab === "mensajes" && <Mensajes plantillas={plantillas} setPlantillas={setPlantillas} />}
        {activeTab === "pautas" && <Pautas pautas={pautas} setPautas={setPautas} />}
        {activeTab === "tips" && <Tips tips={tips} setTips={setTips} />}
        {activeTab === "ia" && (
          <AsistenteIA
            clientes={clientes}
            citas={citas}
            resenas={resenas}
            perfilesIA={perfilesIA}
            setPerfilesIA={setPerfilesIA}
            sugerenciasIA={sugerenciasIA}
            setSugerenciasIA={setSugerenciasIA}
            setTareas={setTareas}
            setRecordatorios={setRecordatorios}
          />
        )}
      </main>
    </div>
  );
}

// ---------- Inicio ----------
function Inicio({ citasHoy, stockBajo, ofertasProximas, totalIngresosMes, totalGastosMes, balanceMes, tareasPendientes }) {
  return (
    <div>
      <SectionHeader icon={<Home size={18} />} title="Buenos días, Luis" subtitle="Esto es lo más importante de Kajalu hoy." />

      <div className="k-grid cols-3">
        <Card style={{ marginBottom: 0 }}>
          <div className="k-stat">
            <div className="row">
              <span className="label">Ingresos del mes</span>
              <TrendingUp size={16} color="var(--success)" />
            </div>
            <div className="value">{money(totalIngresosMes)}</div>
          </div>
        </Card>
        <Card style={{ marginBottom: 0 }}>
          <div className="k-stat">
            <div className="row">
              <span className="label">Gastos del mes</span>
              <TrendingDown size={16} color="var(--danger)" />
            </div>
            <div className="value">{money(totalGastosMes)}</div>
          </div>
        </Card>
        <Card style={{ marginBottom: 0 }}>
          <div className="k-stat">
            <div className="row">
              <span className="label">Balance</span>
              <Wallet size={16} color="var(--accent)" />
            </div>
            <div className="value" style={{ color: balanceMes >= 0 ? "var(--success)" : "var(--danger)" }}>
              {money(balanceMes)}
            </div>
          </div>
        </Card>
      </div>

      <div className="k-grid cols-2" style={{ marginTop: 4 }}>
        <Card>
          <h3>Citas de hoy</h3>
          {citasHoy.length === 0 && <EmptyState text="No tienes citas agendadas para hoy." />}
          {citasHoy.map((c) => (
            <div className="k-list-row" key={c.id}>
              <div className="main">
                <div className="title">{c.hora} · {c.cliente}</div>
                <div className="sub">{c.servicio}</div>
              </div>
              <span className={"k-badge " + c.estado}>{c.estado}</span>
            </div>
          ))}
        </Card>

        <Card>
          <h3>Alertas de inventario</h3>
          {stockBajo.length === 0 && <EmptyState text="Todo tu inventario está en buen nivel." />}
          {stockBajo.map((p) => (
            <div className="k-list-row" key={p.id}>
              <div className="main">
                <div className="title">{p.nombre}</div>
                <div className="sub">Quedan {p.stock} · mínimo {p.minimo}</div>
              </div>
              <span className="k-badge bajo"><AlertTriangle size={11} style={{ marginRight: 4, verticalAlign: -1 }} />bajo</span>
            </div>
          ))}
        </Card>

        <Card>
          <h3>Próximas ofertas a recordar</h3>
          {ofertasProximas.length === 0 && <EmptyState text="No hay ofertas próximas registradas." />}
          {ofertasProximas.map((o) => (
            <div className="k-list-row" key={o.id}>
              <div className="main">
                <div className="title">{o.texto}</div>
                <div className="sub">{o.fecha}</div>
              </div>
              <span className="k-badge oferta">oferta</span>
            </div>
          ))}
        </Card>

        <Card>
          <h3>Tareas pendientes</h3>
          {tareasPendientes.length === 0 && <EmptyState text="No tienes tareas pendientes. ¡Vas al día!" />}
          {tareasPendientes.map((t) => (
            <div className="k-list-row" key={t.id}>
              <div className="main"><div className="title">{t.texto}</div></div>
              <ChevronRight size={16} color="var(--ink-soft)" />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ---------- Citas ----------
function Citas({ citas, setCitas, clientes, cycleEstadoCita }) {
  const [form, setForm] = useState({ cliente: "", servicio: "", fecha: todayISO, hora: "10:00", precio: "" });

  const addCita = () => {
    if (!form.cliente.trim() || !form.servicio.trim()) return;
    setCitas((cs) => [...cs, { id: uid(), ...form, precio: Number(form.precio) || 0, estado: "pendiente" }]);
    setForm({ cliente: "", servicio: "", fecha: todayISO, hora: "10:00", precio: "" });
  };

  const ordenadas = [...citas].sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

  return (
    <div>
      <SectionHeader icon={<CalendarCheck size={18} />} title="Reservación de citas" subtitle="Agenda, confirma y da seguimiento a cada servicio." />
      <Card>
        <h3>Agendar nueva cita</h3>
        <div className="k-form">
          <input list="clientes-lista" placeholder="Cliente" value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} />
          <datalist id="clientes-lista">
            {clientes.map((c) => <option key={c.id} value={c.nombre} />)}
          </datalist>
          <input placeholder="Servicio" value={form.servicio} onChange={(e) => setForm({ ...form, servicio: e.target.value })} />
          <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          <input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
          <input type="number" placeholder="Precio" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} style={{ maxWidth: 100 }} />
          <button className="k-btn" onClick={addCita}><Plus size={14} />Agendar</button>
        </div>
      </Card>
      <Card>
        <h3>Todas las citas</h3>
        {ordenadas.length === 0 && <EmptyState text="Aún no hay citas registradas." />}
        {ordenadas.map((c) => (
          <div className="k-list-row" key={c.id}>
            <div className="main">
              <div className="title">{c.cliente} · {c.servicio}</div>
              <div className="sub">{c.fecha} a las {c.hora} · {money(c.precio)}</div>
            </div>
            <span className={"k-badge " + c.estado} style={{ cursor: "pointer" }} onClick={() => cycleEstadoCita(c.id)} title="Clic para cambiar estado">
              {c.estado}
            </span>
            <IconBtn danger onClick={() => setCitas((cs) => cs.filter((x) => x.id !== c.id))} title="Eliminar">
              <Trash2 size={14} />
            </IconBtn>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ---------- Clientes ----------
function Clientes({ clientes, setClientes, citas }) {
  const [form, setForm] = useState({ nombre: "", telefono: "", notas: "" });

  const addCliente = () => {
    if (!form.nombre.trim()) return;
    setClientes((cs) => [...cs, { id: uid(), ...form }]);
    setForm({ nombre: "", telefono: "", notas: "" });
  };

  const ultimaVisita = (nombre) => {
    const visitas = citas.filter((c) => c.cliente === nombre && c.estado === "completada").map((c) => c.fecha);
    return visitas.length ? visitas.sort().slice(-1)[0] : "—";
  };

  return (
    <div>
      <SectionHeader icon={<Users size={18} />} title="Base de datos de clientes" subtitle="Contactos, preferencias y su historial contigo." />
      <Card>
        <h3>Agregar cliente</h3>
        <div className="k-form">
          <input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <input placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <input placeholder="Notas (preferencias, alergias...)" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          <button className="k-btn" onClick={addCliente}><Plus size={14} />Agregar</button>
        </div>
      </Card>
      <Card>
        <table className="k-table">
          <thead><tr><th>Nombre</th><th>Teléfono</th><th>Notas</th><th>Última visita</th><th></th></tr></thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td><Phone size={12} style={{ marginRight: 5, verticalAlign: -1 }} />{c.telefono}</td>
                <td style={{ color: "var(--ink-soft)" }}>{c.notas || "—"}</td>
                <td>{ultimaVisita(c.nombre)}</td>
                <td><IconBtn danger onClick={() => setClientes((cs) => cs.filter((x) => x.id !== c.id))}><Trash2 size={14} /></IconBtn></td>
              </tr>
            ))}
          </tbody>
        </table>
        {clientes.length === 0 && <EmptyState text="Aún no hay clientes registrados." />}
      </Card>
    </div>
  );
}

// ---------- Catálogo (productos + inventario + compras) ----------
function Catalogo({ productos, setProductos, compras, setCompras, marcarCompra }) {
  const [form, setForm] = useState({ nombre: "", categoria: "", precio: "", stock: "", minimo: "" });
  const [formCompra, setFormCompra] = useState({ item: "", proveedor: "", cantidad: "", costo: "" });

  const addProducto = () => {
    if (!form.nombre.trim()) return;
    setProductos((ps) => [...ps, {
      id: uid(), nombre: form.nombre, categoria: form.categoria || "General",
      precio: Number(form.precio) || 0, stock: Number(form.stock) || 0, minimo: Number(form.minimo) || 1,
    }]);
    setForm({ nombre: "", categoria: "", precio: "", stock: "", minimo: "" });
  };

  const addCompra = () => {
    if (!formCompra.item.trim()) return;
    setCompras((cs) => [...cs, {
      id: uid(), item: formCompra.item, proveedor: formCompra.proveedor,
      cantidad: Number(formCompra.cantidad) || 0, costo: Number(formCompra.costo) || 0,
      fecha: todayISO, estado: "pendiente",
    }]);
    setFormCompra({ item: "", proveedor: "", cantidad: "", costo: "" });
  };

  return (
    <div>
      <SectionHeader icon={<Package size={18} />} title="Catálogo e inventario" subtitle="Productos ofrecidos, existencias y compras a proveedores." />

      <Card>
        <h3>Agregar producto</h3>
        <div className="k-form">
          <input placeholder="Nombre del producto" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <input placeholder="Categoría" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
          <input type="number" placeholder="Precio" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} style={{ maxWidth: 100 }} />
          <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} style={{ maxWidth: 90 }} />
          <input type="number" placeholder="Mínimo" value={form.minimo} onChange={(e) => setForm({ ...form, minimo: e.target.value })} style={{ maxWidth: 90 }} />
          <button className="k-btn" onClick={addProducto}><Plus size={14} />Agregar</button>
        </div>
      </Card>

      <Card>
        <table className="k-table">
          <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th></th></tr></thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td style={{ color: "var(--ink-soft)" }}>{p.categoria}</td>
                <td>{money(p.precio)}</td>
                <td>
                  {p.stock} {p.stock <= p.minimo && <span className="k-badge bajo" style={{ marginLeft: 6 }}>bajo</span>}
                </td>
                <td><IconBtn danger onClick={() => setProductos((ps) => ps.filter((x) => x.id !== p.id))}><Trash2 size={14} /></IconBtn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <h3>Registrar compra a proveedor</h3>
        <div className="k-form">
          <input placeholder="Producto / item" value={formCompra.item} onChange={(e) => setFormCompra({ ...formCompra, item: e.target.value })} />
          <input placeholder="Proveedor" value={formCompra.proveedor} onChange={(e) => setFormCompra({ ...formCompra, proveedor: e.target.value })} />
          <input type="number" placeholder="Cantidad" value={formCompra.cantidad} onChange={(e) => setFormCompra({ ...formCompra, cantidad: e.target.value })} style={{ maxWidth: 100 }} />
          <input type="number" placeholder="Costo total" value={formCompra.costo} onChange={(e) => setFormCompra({ ...formCompra, costo: e.target.value })} style={{ maxWidth: 110 }} />
          <button className="k-btn" onClick={addCompra}><Plus size={14} />Registrar</button>
        </div>
      </Card>

      <Card>
        <h3>Compras registradas</h3>
        {compras.length === 0 && <EmptyState text="No hay compras registradas." />}
        {compras.map((c) => (
          <div className="k-list-row" key={c.id}>
            <div className="main">
              <div className="title"><ShoppingCart size={13} style={{ marginRight: 5, verticalAlign: -2 }} />{c.item} · {c.cantidad} un.</div>
              <div className="sub">{c.proveedor} · {money(c.costo)} · {c.fecha}</div>
            </div>
            <span className={"k-badge " + c.estado} style={{ cursor: c.estado === "pendiente" ? "pointer" : "default" }} onClick={() => marcarCompra(c.id)} title={c.estado === "pendiente" ? "Clic para marcar como recibida" : ""}>
              {c.estado}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ---------- Finanzas (gastos + monetización) ----------
function Finanzas({ gastos, setGastos, ventas, setVentas, totalIngresosMes, totalGastosMes, balanceMes, chartData }) {
  const [formGasto, setFormGasto] = useState({ concepto: "", categoria: "", monto: "", fecha: todayISO });
  const [formVenta, setFormVenta] = useState({ concepto: "", monto: "", fecha: todayISO });

  const addGasto = () => {
    if (!formGasto.concepto.trim()) return;
    setGastos((gs) => [...gs, { id: uid(), ...formGasto, monto: Number(formGasto.monto) || 0 }]);
    setFormGasto({ concepto: "", categoria: "", monto: "", fecha: todayISO });
  };
  const addVenta = () => {
    if (!formVenta.concepto.trim()) return;
    setVentas((vs) => [...vs, { id: uid(), ...formVenta, monto: Number(formVenta.monto) || 0 }]);
    setFormVenta({ concepto: "", monto: "", fecha: todayISO });
  };

  return (
    <div>
      <SectionHeader icon={<Wallet size={18} />} title="Finanzas y monetización" subtitle="Gastos, ventas de productos y el balance del negocio." />

      <div className="k-grid cols-3">
        <Card style={{ marginBottom: 0 }}><div className="k-stat"><span className="label">Ingresos del mes</span><div className="value">{money(totalIngresosMes)}</div></div></Card>
        <Card style={{ marginBottom: 0 }}><div className="k-stat"><span className="label">Gastos del mes</span><div className="value">{money(totalGastosMes)}</div></div></Card>
        <Card style={{ marginBottom: 0 }}><div className="k-stat"><span className="label">Balance</span><div className="value" style={{ color: balanceMes >= 0 ? "var(--success)" : "var(--danger)" }}>{money(balanceMes)}</div></div></Card>
      </div>

      {chartData.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <h3>Ingresos vs. gastos por mes</h3>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--ink-soft)" }} />
                <YAxis tick={{ fontSize: 12, fill: "var(--ink-soft)" }} />
                <Tooltip formatter={(v) => money(v)} />
                <Legend wrapperStyle={{ fontSize: 12.5 }} />
                <Bar dataKey="ingresos" fill="var(--success)" radius={[4, 4, 0, 0]} name="Ingresos" />
                <Bar dataKey="gastos" fill="var(--danger)" radius={[4, 4, 0, 0]} name="Gastos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="k-grid cols-2">
        <Card>
          <h3>Registrar gasto</h3>
          <div className="k-form">
            <input placeholder="Concepto" value={formGasto.concepto} onChange={(e) => setFormGasto({ ...formGasto, concepto: e.target.value })} />
            <input placeholder="Categoría" value={formGasto.categoria} onChange={(e) => setFormGasto({ ...formGasto, categoria: e.target.value })} />
            <input type="number" placeholder="Monto" value={formGasto.monto} onChange={(e) => setFormGasto({ ...formGasto, monto: e.target.value })} />
            <input type="date" value={formGasto.fecha} onChange={(e) => setFormGasto({ ...formGasto, fecha: e.target.value })} />
            <button className="k-btn" onClick={addGasto}><Plus size={14} />Agregar</button>
          </div>
          {gastos.slice().reverse().map((g) => (
            <div className="k-list-row" key={g.id}>
              <div className="main"><div className="title">{g.concepto}</div><div className="sub">{g.categoria} · {g.fecha}</div></div>
              <div style={{ fontWeight: 600, color: "var(--danger)" }}>-{money(g.monto)}</div>
              <IconBtn danger onClick={() => setGastos((gs) => gs.filter((x) => x.id !== g.id))}><Trash2 size={14} /></IconBtn>
            </div>
          ))}
        </Card>

        <Card>
          <h3>Registrar venta / ingreso extra</h3>
          <div className="k-form">
            <input placeholder="Concepto" value={formVenta.concepto} onChange={(e) => setFormVenta({ ...formVenta, concepto: e.target.value })} />
            <input type="number" placeholder="Monto" value={formVenta.monto} onChange={(e) => setFormVenta({ ...formVenta, monto: e.target.value })} />
            <input type="date" value={formVenta.fecha} onChange={(e) => setFormVenta({ ...formVenta, fecha: e.target.value })} />
            <button className="k-btn" onClick={addVenta}><Plus size={14} />Agregar</button>
          </div>
          {ventas.slice().reverse().map((v) => (
            <div className="k-list-row" key={v.id}>
              <div className="main"><div className="title">{v.concepto}</div><div className="sub">{v.fecha}</div></div>
              <div style={{ fontWeight: 600, color: "var(--success)" }}>+{money(v.monto)}</div>
              <IconBtn danger onClick={() => setVentas((vs) => vs.filter((x) => x.id !== v.id))}><Trash2 size={14} /></IconBtn>
            </div>
          ))}
          <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 8 }}>Los servicios marcados como "completada" en Citas también suman aquí automáticamente.</p>
        </Card>
      </div>
    </div>
  );
}

// ---------- Tareas y notas ----------
function TareasNotas({ tareas, setTareas, notas, setNotas }) {
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [nuevaNota, setNuevaNota] = useState("");

  const addTarea = () => {
    if (!nuevaTarea.trim()) return;
    setTareas((ts) => [...ts, { id: uid(), texto: nuevaTarea, hecha: false }]);
    setNuevaTarea("");
  };
  const addNota = () => {
    if (!nuevaNota.trim()) return;
    setNotas((ns) => [...ns, { id: uid(), texto: nuevaNota }]);
    setNuevaNota("");
  };

  return (
    <div>
      <SectionHeader icon={<CheckSquare size={18} />} title="Tareas y notas" subtitle="Lo que hay por hacer y lo que no quieres olvidar." />
      <div className="k-grid cols-2">
        <Card>
          <h3>Tareas</h3>
          <div className="k-form">
            <input placeholder="Nueva tarea" value={nuevaTarea} onChange={(e) => setNuevaTarea(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTarea()} />
            <button className="k-btn" onClick={addTarea}><Plus size={14} />Agregar</button>
          </div>
          {tareas.map((t) => (
            <div className="k-list-row" key={t.id}>
              <div className={"k-checkbox" + (t.hecha ? " checked" : "")} onClick={() => setTareas((ts) => ts.map((x) => x.id === t.id ? { ...x, hecha: !x.hecha } : x))}>
                {t.hecha && <CheckSquare size={12} />}
              </div>
              <div className="main" style={{ marginLeft: 10 }}>
                <div className="title" style={{ textDecoration: t.hecha ? "line-through" : "none", color: t.hecha ? "var(--ink-soft)" : "var(--ink)" }}>{t.texto}</div>
              </div>
              <IconBtn danger onClick={() => setTareas((ts) => ts.filter((x) => x.id !== t.id))}><Trash2 size={14} /></IconBtn>
            </div>
          ))}
          {tareas.length === 0 && <EmptyState text="No hay tareas." />}
        </Card>

        <Card>
          <h3>Notas</h3>
          <div className="k-form">
            <input placeholder="Nueva nota" value={nuevaNota} onChange={(e) => setNuevaNota(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNota()} />
            <button className="k-btn" onClick={addNota}><Plus size={14} />Agregar</button>
          </div>
          {notas.map((n) => (
            <div className="k-list-row" key={n.id}>
              <div className="main"><div className="title">{n.texto}</div></div>
              <IconBtn danger onClick={() => setNotas((ns) => ns.filter((x) => x.id !== n.id))}><Trash2 size={14} /></IconBtn>
            </div>
          ))}
          {notas.length === 0 && <EmptyState text="No hay notas." />}
        </Card>
      </div>
    </div>
  );
}

// ---------- Recordatorios y ofertas ----------
function Recordatorios({ recordatorios, setRecordatorios }) {
  const [form, setForm] = useState({ texto: "", fecha: todayISO, tipo: "general" });

  const addRecordatorio = () => {
    if (!form.texto.trim()) return;
    setRecordatorios((rs) => [...rs, { id: uid(), ...form }]);
    setForm({ texto: "", fecha: todayISO, tipo: "general" });
  };

  const ordenados = [...recordatorios].sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div>
      <SectionHeader icon={<BellRing size={18} />} title="Recordatorios y ofertas" subtitle="No dejes pasar fechas importantes ni promociones para tus clientas." />
      <Card>
        <h3>Nuevo recordatorio</h3>
        <div className="k-form">
          <input placeholder="Descripción" value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} style={{ flex: 2 }} />
          <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            <option value="general">General</option>
            <option value="oferta">Oferta</option>
          </select>
          <button className="k-btn" onClick={addRecordatorio}><Plus size={14} />Agregar</button>
        </div>
      </Card>
      <Card>
        {ordenados.length === 0 && <EmptyState text="No hay recordatorios registrados." />}
        {ordenados.map((r) => (
          <div className="k-list-row" key={r.id}>
            <div className="main"><div className="title">{r.texto}</div><div className="sub">{r.fecha}</div></div>
            <span className={"k-badge " + r.tipo}>{r.tipo}</span>
            <IconBtn danger onClick={() => setRecordatorios((rs) => rs.filter((x) => x.id !== r.id))}><Trash2 size={14} /></IconBtn>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ---------- Mensajes automáticos ----------
function Mensajes({ plantillas, setPlantillas }) {
  const [form, setForm] = useState({ palabra: "", respuesta: "" });
  const [prueba, setPrueba] = useState("");

  const addPlantilla = () => {
    if (!form.palabra.trim() || !form.respuesta.trim()) return;
    setPlantillas((ps) => [...ps, { id: uid(), ...form }]);
    setForm({ palabra: "", respuesta: "" });
  };

  const coincidencia = plantillas.find((p) => prueba.toLowerCase().includes(p.palabra.toLowerCase()));

  return (
    <div>
      <SectionHeader icon={<MessageCircle size={18} />} title="Automatización de mensajes" subtitle="Respuestas automáticas según lo que escriban tus clientas." />
      <Card>
        <h3>Probar automatización</h3>
        <div className="k-form">
          <input placeholder='Escribe un mensaje de ejemplo, ej: "¿Cuál es el precio?"' value={prueba} onChange={(e) => setPrueba(e.target.value)} style={{ flex: 1 }} />
        </div>
        {prueba && (
          <div className="k-tipcard" style={{ marginTop: 10 }}>
            <div className="cat">Respuesta automática</div>
            <p style={{ color: "var(--ink)" }}>{coincidencia ? coincidencia.respuesta : "Ninguna plantilla coincide todavía — se enviaría a atención manual."}</p>
          </div>
        )}
      </Card>
      <Card>
        <h3>Nueva plantilla</h3>
        <div className="k-form">
          <input placeholder="Palabra clave (ej: precio, cita, horario)" value={form.palabra} onChange={(e) => setForm({ ...form, palabra: e.target.value })} />
          <input placeholder="Respuesta automática" value={form.respuesta} onChange={(e) => setForm({ ...form, respuesta: e.target.value })} style={{ flex: 2 }} />
          <button className="k-btn" onClick={addPlantilla}><Plus size={14} />Agregar</button>
        </div>
      </Card>
      <Card>
        {plantillas.map((p) => (
          <div className="k-list-row" key={p.id}>
            <div className="main"><div className="title">"{p.palabra}"</div><div className="sub">{p.respuesta}</div></div>
            <IconBtn danger onClick={() => setPlantillas((ps) => ps.filter((x) => x.id !== p.id))}><Trash2 size={14} /></IconBtn>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ---------- Tips de belleza ----------
function Tips({ tips, setTips }) {
  const [form, setForm] = useState({ titulo: "", texto: "", categoria: "" });

  const addTip = () => {
    if (!form.titulo.trim()) return;
    setTips((ts) => [...ts, { id: uid(), ...form }]);
    setForm({ titulo: "", texto: "", categoria: "" });
  };

  return (
    <div>
      <SectionHeader icon={<Sparkles size={18} />} title="Tips de belleza" subtitle="Contenido listo para compartir con tus clientas." />
      <Card>
        <h3>Nuevo tip</h3>
        <div className="k-form">
          <input placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          <input placeholder="Categoría" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
          <input placeholder="Texto del tip" value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} style={{ flex: 2 }} />
          <button className="k-btn" onClick={addTip}><Plus size={14} />Agregar</button>
        </div>
      </Card>
      <div className="k-grid cols-2">
        {tips.map((t) => (
          <div className="k-tipcard" key={t.id} style={{ position: "relative" }}>
            <div className="cat">{t.categoria || "General"}</div>
            <h4>{t.titulo}</h4>
            <p>{t.texto}</p>
            <div style={{ position: "absolute", top: 10, right: 10 }}>
              <IconBtn danger onClick={() => setTips((ts) => ts.filter((x) => x.id !== t.id))}><Trash2 size={14} /></IconBtn>
            </div>
          </div>
        ))}
      </div>
// ---------- Servicios y precios ----------
function Servicios({ servicios, setServicios }) {
  const [form, setForm] = useState({ nombre: "", categoria: "", precio: "", duracion: "" });

  const addServicio = () => {
    if (!form.nombre.trim()) return;
    setServicios((ss) => [...ss, { id: uid(), ...form, precio: Number(form.precio) || 0 }]);
    setForm({ nombre: "", categoria: "", precio: "", duracion: "" });
  };

  const porCategoria = servicios.reduce((acc, s) => {
    const cat = s.categoria || "Otros";
    (acc[cat] = acc[cat] || []).push(s);
    return acc;
  }, {});

  return (
    <div>
      <SectionHeader icon={<Tag size={18} />} title="Servicios y precios ofrecidos" subtitle="El menú de servicios que le muestras a tus clientas." />
      <Card>
        <h3>Agregar servicio</h3>
        <div className="k-form">
          <input placeholder="Nombre del servicio" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <input placeholder="Categoría (ej: Masajes, Uñas...)" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
          <input type="number" placeholder="Precio" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} style={{ maxWidth: 110 }} />
          <input placeholder="Duración (ej: 45 min)" value={form.duracion} onChange={(e) => setForm({ ...form, duracion: e.target.value })} style={{ maxWidth: 130 }} />
          <button className="k-btn" onClick={addServicio}><Plus size={14} />Agregar</button>
        </div>
      </Card>

      {Object.keys(porCategoria).length === 0 && <EmptyState text="Aún no hay servicios registrados." />}
      {Object.entries(porCategoria).map(([cat, lista]) => (
        <Card key={cat}>
          <h3>{cat}</h3>
          {lista.map((s) => (
            <div className="k-list-row" key={s.id}>
              <div className="main">
                <div className="title">{s.nombre}</div>
                {s.duracion && <div className="sub">{s.duracion}</div>}
              </div>
              <div style={{ fontWeight: 600 }}>{money(s.precio)}</div>
              <IconBtn danger onClick={() => setServicios((ss) => ss.filter((x) => x.id !== s.id))}><Trash2 size={14} /></IconBtn>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

// ---------- Reseñas de clientes ----------
function Estrellas({ n }) {
  return (
    <span style={{ color: "var(--gold)", letterSpacing: 1 }}>
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

function Resenas({ resenas, setResenas, clientes }) {
  const [form, setForm] = useState({ cliente: "", calificacion: 5, comentario: "" });

  const addResena = () => {
    if (!form.cliente.trim() || !form.comentario.trim()) return;
    setResenas((rs) => [{ id: uid(), ...form, calificacion: Number(form.calificacion), fecha: todayISO }, ...rs]);
    setForm({ cliente: "", calificacion: 5, comentario: "" });
  };

  const promedio = resenas.length
    ? (resenas.reduce((s, r) => s + r.calificacion, 0) / resenas.length).toFixed(1)
    : "—";

  return (
    <div>
      <SectionHeader icon={<Star size={18} />} title="Reseñas de clientes" subtitle="Lo que opinan tus clientas después de cada visita." />

      <Card>
        <div className="k-stat" style={{ padding: 0 }}>
          <span className="label">Calificación promedio</span>
          <div className="value">{promedio} {resenas.length > 0 && <span style={{ fontSize: 15 }}><Estrellas n={Math.round(resenas.reduce((s, r) => s + r.calificacion, 0) / resenas.length)} /></span>}</div>
        </div>
      </Card>

      <Card>
        <h3>Nueva reseña</h3>
        <div className="k-form">
          <input list="clientes-lista-resenas" placeholder="Cliente" value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} />
          <datalist id="clientes-lista-resenas">
            {clientes.map((c) => <option key={c.id} value={c.nombre} />)}
          </datalist>
          <select value={form.calificacion} onChange={(e) => setForm({ ...form, calificacion: e.target.value })} style={{ maxWidth: 110 }}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} estrellas</option>)}
          </select>
          <input placeholder="Comentario de la visita" value={form.comentario} onChange={(e) => setForm({ ...form, comentario: e.target.value })} style={{ flex: 2 }} />
          <button className="k-btn" onClick={addResena}><Plus size={14} />Agregar</button>
        </div>
      </Card>

      <Card>
        {resenas.length === 0 && <EmptyState text="Aún no hay reseñas registradas." />}
        {resenas.map((r) => (
          <div className="k-list-row" key={r.id}>
            <div className="main">
              <div className="title">{r.cliente} · <Estrellas n={r.calificacion} /></div>
              <div className="sub">{r.comentario}</div>
              <div className="sub">{r.fecha}</div>
            </div>
            <IconBtn danger onClick={() => setResenas((rs) => rs.filter((x) => x.id !== r.id))}><Trash2 size={14} /></IconBtn>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ---------- Pautas y promociones ----------
function Pautas({ pautas, setPautas }) {
  const [form, setForm] = useState({ titulo: "", categoria: "", texto: "" });

  const addPauta = () => {
    if (!form.titulo.trim()) return;
    setPautas((ps) => [...ps, { id: uid(), ...form }]);
    setForm({ titulo: "", categoria: "", texto: "" });
  };

  return (
    <div>
      <SectionHeader icon={<Megaphone size={18} />} title="Pautas y promociones" subtitle="Ideas y piezas para promocionar servicios como masajes reductores, manicura y más." />
      <Card>
        <h3>Nueva pauta</h3>
        <div className="k-form">
          <input placeholder="Título de la pauta" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          <input placeholder="Categoría (ej: Masajes reductores, Manicura...)" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
          <input placeholder="Texto / mensaje promocional" value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} style={{ flex: 2 }} />
          <button className="k-btn" onClick={addPauta}><Plus size={14} />Agregar</button>
        </div>
      </Card>
      <div className="k-grid cols-2">
        {pautas.map((p) => (
          <div className="k-tipcard" key={p.id} style={{ position: "relative" }}>
            <div className="cat">{p.categoria || "General"}</div>
            <h4>{p.titulo}</h4>
            <p>{p.texto}</p>
            <div style={{ position: "absolute", top: 10, right: 10 }}>
              <IconBtn danger onClick={() => setPautas((ps) => ps.filter((x) => x.id !== p.id))}><Trash2 size={14} /></IconBtn>
            </div>
          </div>
        ))}
      </div>
      {pautas.length === 0 && <EmptyState text="Aún no hay pautas registradas." />}
    </div>
  );
}

// ---------- Asistente IA (fidelización y gestión autónoma de tareas) ----------
function AsistenteIA({ clientes, citas, resenas, perfilesIA, setPerfilesIA, sugerenciasIA, setSugerenciasIA, setTareas, setRecordatorios }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const construirResumenClientes = () => {
    return clientes.map((c) => {
      const historial = citas
        .filter((ci) => ci.cliente === c.nombre)
        .map((ci) => `${ci.fecha} - ${ci.servicio} (${ci.estado})`)
        .join("; ") || "sin citas registradas";
      const opiniones = resenas
        .filter((r) => r.cliente === c.nombre)
        .map((r) => `${r.calificacion}★: "${r.comentario}"`)
        .join("; ") || "sin reseñas";
      return `Cliente: ${c.nombre}\nNotas: ${c.notas || "ninguna"}\nHistorial de citas: ${historial}\nReseñas: ${opiniones}`;
    }).join("\n\n");
  };

  const analizar = async () => {
    setCargando(true);
    setError("");
    try {
      const resumen = construirResumenClientes();
      const prompt = `Eres el asistente de fidelización de un negocio de belleza llamado KajaluApp. Analiza la información de cada cliente y responde ÚNICAMENTE con un JSON válido (sin texto adicional, sin backticks) con esta forma exacta:
{"perfiles":[{"cliente":"nombre","preferencias":"resumen breve de sus preferencias y hábitos en 1-2 frases"}],"sugerencias":[{"cliente":"nombre","tipo":"tarea"|"recordatorio","texto":"acción concreta y breve para fidelizar a esa clienta"}]}

Genera máximo 1 perfil por cliente y máximo 2 sugerencias por cliente, basadas solo en la información dada. Datos de clientes:

${resumen}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      const textBlock = (data.content || []).map((b) => b.text || "").join("\n");
      const clean = textBlock.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      // Fusiona perfiles nuevos con los existentes (así "aprende" con cada análisis)
      setPerfilesIA((prev) => {
        const mapa = {};
        prev.forEach((p) => { mapa[p.cliente] = p; });
        (parsed.perfiles || []).forEach((p) => {
          mapa[p.cliente] = { cliente: p.cliente, preferencias: p.preferencias, actualizado: todayISO };
        });
        return Object.values(mapa);
      });

      setSugerenciasIA((prev) => [
        ...(parsed.sugerencias || []).map((s) => ({ id: uid(), ...s, aplicada: false })),
        ...prev,
      ]);
    } catch (e) {
      setError("No se pudo completar el análisis. Intenta de nuevo en un momento.");
    } finally {
      setCargando(false);
    }
  };

  const aplicarSugerencia = (s) => {
    if (s.tipo === "tarea") {
      setTareas((ts) => [...ts, { id: uid(), texto: `${s.texto} (${s.cliente})`, hecha: false }]);
    } else {
      setRecordatorios((rs) => [...rs, { id: uid(), texto: `${s.texto} (${s.cliente})`, fecha: addDays(todayISO, 3), tipo: "general" }]);
    }
    setSugerenciasIA((ss) => ss.map((x) => (x.id === s.id ? { ...x, aplicada: true } : x)));
  };

  return (
    <div>
      <SectionHeader
        icon={<Bot size={18} />}
        title="Asistente IA de fidelización"
        subtitle="Aprende de las preferencias de cada clienta y propone acciones para fidelizarlas."
      />

      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-soft)", maxWidth: 480 }}>
            Analiza el historial de citas, notas y reseñas de tus clientas para detectar preferencias
            y sugerir tareas o recordatorios de fidelización. Cada vez que lo ejecutes, va afinando
            lo que sabe de cada clienta.
          </p>
          <button className="k-btn" onClick={analizar} disabled={cargando}>
            {cargando ? <Loader2 size={14} className="k-spin" /> : <Bot size={14} />}
            {cargando ? "Analizando…" : "Analizar clientes"}
          </button>
        </div>
        {error && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 10, marginBottom: 0 }}>{error}</p>}
      </Card>

      <div className="k-grid cols-2">
        <Card>
          <h3>Perfiles de preferencias</h3>
          {perfilesIA.length === 0 && <EmptyState text="Aún no se ha analizado ninguna clienta." />}
          {perfilesIA.map((p) => (
            <div className="k-list-row" key={p.cliente}>
              <div className="main">
                <div className="title">{p.cliente}</div>
                <div className="sub">{p.preferencias}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <h3>Sugerencias para fidelizar</h3>
          {sugerenciasIA.length === 0 && <EmptyState text="Aquí aparecerán las sugerencias después de analizar." />}
          {sugerenciasIA.map((s) => (
            <div className="k-list-row" key={s.id}>
              <div className="main">
                <div className="title">{s.cliente}</div>
                <div className="sub">{s.texto}</div>
              </div>
              {s.aplicada ? (
                <span className="k-badge completada"><CheckCircle2 size={11} style={{ marginRight: 4, verticalAlign: -1 }} />agregada</span>
              ) : (
                <button className="k-btn ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => aplicarSugerencia(s)}>
                  Agregar como {s.tipo}
                </button>
              )}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
