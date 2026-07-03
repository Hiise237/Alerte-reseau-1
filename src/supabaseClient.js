import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yjiyvtitwxdzfgjvohgz.supabase.co";
const supabaseKey = "sb_publishable_VvRiHaAvYOe8w5ojiNcVhA_7Sn9Rth5";

export const supabase = createClient(supabaseUrl, supabaseKey);
