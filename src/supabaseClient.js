import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yjiyvtitwxdzfgjvohgz.supabase.co";
const supabaseKey = "sb_publishable_VvRiHaAvYOe8w5ojiNcVhA_7Sn9Rth5";

export let supabase = null;
export let supabaseInitError = null;

try {
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (err) {
  supabaseInitError = err;
}
