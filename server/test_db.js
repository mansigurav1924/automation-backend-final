require('dotenv').config();
const supabase = require('./config/supabaseClient');

async function testConnection() {
  const email = 'mgurav2412@gmail.com';
  console.log("Checking user...");
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  console.log("Result:", { existingUser, checkError });

  console.log("Inserting user...");
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert([{
      name: 'mansi gurav',
      email: email,
      password_hash: 'test_hash',
      role: 'manager',
      department: 'Full Stack Intern'
    }])
    .select()
    .single();

  console.log("Insert result:", { newUser, insertError });
}
testConnection();
