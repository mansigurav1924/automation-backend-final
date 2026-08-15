require('dotenv').config();
const supabase = require('./config/supabaseClient');

async function cleanup() {
  const email = 'mgurav2412@gmail.com';
  console.log("Deleting user...");
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('email', email);

  console.log("Delete result:", { data, error });
}
cleanup();
