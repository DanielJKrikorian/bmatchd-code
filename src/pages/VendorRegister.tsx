import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { supabase, signUp } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const VendorRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    console.log('VendorRegister: Mounted');
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('VendorRegister: User logged in, redirecting to /vendor/onboarding');
        navigate('/vendor/onboarding');
      }
    };
    checkUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('VendorRegister: Submitting', formData);

    try {
      const { data, error } = await signUp(formData.email, formData.password, 'vendor');

      if (error) throw error;
      if (!data?.user) throw new Error('User registration failed');

      console.log('VendorRegister: User signed up:', data.user.id);

      const { error: createError } = await supabase
        .from('vendors')
        .insert([{ user_id: data.user.id, business_name: '' }]);

      if (createError) throw createError;

      console.log('VendorRegister: Vendor profile created');
      toast.success('Account created successfully! Redirecting...');
      setTimeout(() => navigate('/vendor/onboarding'), 1000);
    } catch (error: any) {
      console.error('VendorRegister: Error:', error);
      toast.error(error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Vendor Registration</h1>
        <p className="text-gray-600 mb-6 text-center">Create your vendor account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Registering...' : 'Create Account'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default VendorRegister;