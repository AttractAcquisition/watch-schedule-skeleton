// Watch Schedule — Supabase browser client.
// Reads config from Vite environment variables (see .env.example).

import { createClient } from "@supabase/supabase-js";

// NOTE: the client is intentionally untyped at the schema level. Explicit row
// interfaces in ./database.types are used as return types in the api layer
// instead, which avoids the `never` insert/update friction of hand-authored
// Database generics. Regenerate types with the Supabase CLI for full typing:
//   supabase gen types typescript --project-id <ref> > src/lib/database.types.ts

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local " +
      "(copy .env.example). See SUPABASE_SETUP.md.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Whether the dev-only "mark as paid" tooling should be exposed.
export const IS_DEV = import.meta.env.DEV;
