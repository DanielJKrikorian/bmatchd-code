import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users2, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const CoupleSignIn = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/dashboard');
      }
    };
    checkAuthStatus();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send reset instructions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      // First check if user exists and has correct role
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('email', formData.email)
        .single();

      if (userError && !userError.message.includes('No rows found')) {
        throw userError;
      }

      if (existingUser && existingUser.role !== 'couple') {
        toast.error('This email is not registered as a couple account');
        return;
      }

      // Attempt sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
          return;
        }
        throw signInError;
      }

      if (!data.user) throw new Error('No user returned from sign in');

      toast.success('Signed in successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users2 className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Sign in to your Couple Account</h1>
        <p className="text-gray-600 mt-2">Welcome back! Please enter your details.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
            </div>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        <div className="mt-4 space-y-4 text-center">
          <Button
            variant="outline"
            onClick={handleForgotPassword}
            className="w-full"
            disabled={loading}
          >
            Forgot Password?
          </Button>

          <p className="text-sm text-gray-600">
            Don't have a couple account?{' '}
            <button
              onClick={() => navigate('/start-planning')}
              className="text-primary hover:underline font-medium"
            >
              Create Free Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoupleSignIn;