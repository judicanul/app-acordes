// src/supabase/client.js
import { createClient } from '@supabase/supabase-js';

// Obtenemos las credenciales desde las variables de entorno de Vite
const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'tu-anon-key-de-desarrollo').trim();

// Sanitizar la URL: eliminar /rest/v1 o barras inclinadas al final si se copiaron por error
const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

// Inicializamos y exportamos el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
