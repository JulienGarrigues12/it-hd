import { supabase } from './supabase';

export async function createAdminUser() {
  try {
    // Check if admin user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@example.com')
      .single();

    if (existingUser) {
      return { message: 'Admin user already exists. You can login with admin@example.com / admin123' };
    }

    // Create user in auth
    const { data: authUser, error: signUpError } = await supabase.auth.signUp({
      email: 'admin@example.com',
      password: 'admin123',
    });

    if (signUpError) {
      if (signUpError.message === 'User already registered') {
        return { message: 'Admin user already exists. You can login with admin@example.com / admin123' };
      }
      throw signUpError;
    }

    // Insert user profile with admin role and hashed password
    if (authUser.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authUser.user.id,
            email: authUser.user.email,
            role: 'admin',
            full_name: 'Admin User',
            department: 'IT',
            password_hash: supabase.rpc('hash_password', { password: 'admin123' })
          },
        ]);

      if (profileError) {
        throw profileError;
      }
    }

    return { message: 'Admin user created successfully! You can now login with admin@example.com / admin123' };
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}