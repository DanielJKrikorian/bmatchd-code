import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users2, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase, signUp } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface LocationState {
  returnTo?: string;
  preferences?: Record<string, any>;
}

const CoupleAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { returnTo, preferences } = location.state as LocationState || {};
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    agreeToTerms: false
  });

  useEffect(() => {
    // If preferences exist, store them for later
    if (preferences) {
      localStorage.setItem('couplePreferences', JSON.stringify(preferences));
    }
  }, [preferences]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }
    if (loading) return;
    setLoading(true);

    try {
      // First check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('role')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingUser) {
        toast.error('An account with this email already exists. Please sign in instead.');
        navigate('/couple/signin');
        return;
      }

      // Create new user as couple
      const { data, error } = await signUp(formData.email, formData.password, 'couple');
      
      if (error) throw error;
      if (!data?.user) throw new Error('No user returned from signup');

      // Use upsert to handle existing couples (no 409)
      const { error: coupleError } = await supabase
        .from('couples')
        .upsert([{ user_id: data.user.id }], { onConflict: 'user_id' });

      if (coupleError) throw coupleError;

      toast.success('Account created successfully!');
      
      // Clear stored preferences
      localStorage.removeItem('couplePreferences');
      
      // Redirect based on flow
      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate('/couple/onboarding');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      if (error.message?.includes('rate limit')) {
        toast.error('Please wait a moment before trying again');
      } else {
        toast.error(error.message || 'Failed to create account');
      }
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
        <h1 className="text-2xl font-bold">Create Your Couple Account</h1>
        <p className="text-gray-600 mt-2">Start planning your perfect wedding</p>
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
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary pr-10"
                placeholder="Create a password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Must be at least 6 characters
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="agreeToTerms"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              disabled={loading}
            />
            <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
              I agree to the{' '}
              <a href="/terms" className="text-primary hover:underline" target="_blank">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="/privacy" className="text-primary hover:underline" target="_blank">
                Privacy Policy
              </a>
            </label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/couple/signin')}
              className="text-primary hover:underline font-medium"
              disabled={loading}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoupleAuth;