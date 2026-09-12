import { createClient } from "@supabase/supabase-js";

// Datos de conexión del proyecto "KajaluApp" en Supabase.
// La llave "publishable" está diseñada para usarse en el navegador (no es secreta).
const supabaseUrl = "https://xeugcyedyezxtkcywlilq.supabase.co";
const supabaseKey = "sb_publishable_tJJFYatKD0CkgouZn5SLsA__aymW4fL";

export const supabase = createClient(supabaseUrl, supabaseKey);
