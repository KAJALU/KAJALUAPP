import { createClient } from "@supabase/supabase-js";

// Datos de conexión del proyecto "KajaluApp2" en Supabase.
// La llave "publishable" está diseñada para usarse en el navegador (no es secreta).
const supabaseUrl = "https://txghoregizndbneuosvp.supabase.co";
const supabaseKey = "sb_publishable_A6YESZjTN3pfFqfUyvjEgQ_IqtVnl2Y";

export const supabase = createClient(supabaseUrl, supabaseKey);
