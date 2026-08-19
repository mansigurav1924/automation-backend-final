require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
global.WebSocket = require('ws');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function seedAdmin() {
  const email    = 'admin@admin.com';
  const password = 'admin123';
  const name     = 'System Admin';
  const role     = 'admin';

  console.log('Seeding admin user into Supabase...');

  // Check if already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', email)
    .single();

  if (existing) {
    console.log('Admin already exists in Supabase:', existing.email);
    console.log('Updating password hash...');
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const { error } = await supabase
      .from('users')
      .update({ password_hash, role, name })
      .eq('email', email);
    if (error) throw error;
    console.log('✅ Admin password reset to:', password);
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const { data, error } = await supabase.from('users').insert([{
    email,
    password_hash,
    name,
    role,
    department: null,
  }]).select().single();

  if (error) throw error;

  console.log('✅ Admin user created in Supabase!');
  console.log('   Email   :', email);
  console.log('   Password:', password);
  console.log('   Role    :', role);
  console.log('   ID      :', data.id);
}

seedAdmin().catch(err => {
  console.error('❌ Failed to seed admin:', err.message);
  process.exit(1);
});
