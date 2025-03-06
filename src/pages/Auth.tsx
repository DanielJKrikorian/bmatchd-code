import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users2, Store, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase, signUp } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface LocationState {
  returnTo?: string;
  role?: 'vendor' | 'couple';
  preferences?: Record<string, any>;
}

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { returnTo, role: initialRole, preferences } = location.state as LocationState || {};
  
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'vendor' | 'couple' | null>(initialRole || null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
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
    if (!role) {
      toast.error('Please select your account type');
      return;
    }
    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (loading) return;
    setLoading(true);

    try {
      const { data, error } = await signUp(formData.email, formData.password, role);
      
      if (error) {
        if (error.includes('already exists')) {
          toast.error('An account with this email already exists. Please sign in instead.');
          navigate(`/${role}/signin`);
          return;
        }
        throw new Error(error);
      }

      if (!data?.user) throw new Error('No user returned from signup');

      toast.success('Account created successfully!');
      
      // Clear stored preferences
      localStorage.removeItem('couplePreferences');
      
      // Redirect based on role
      if (role === 'vendor') {
        navigate('/vendor/onboarding');
      } else {
        navigate(returnTo || '/couple/onboarding');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Logo and Title */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Create Your Account</h1>
        <p className="text-xl text-gray-600">
          {role ? 
            `Create your ${role} account to get started` :
            'Choose your account type to get started'
          }
        </p>
      </div>

      {!role ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Couple Option */}
          <button
            onClick={() => setRole('couple')}
            className="bg-white rounded-xl shadow-sm p-8 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Users2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">Couple Account</h2>
              <p className="text-gray-600">
                Planning your wedding? Create an account to find and connect with vendors.
              </p>
            </div>
          </button>

          {/* Vendor Option */}
          <button
            onClick={() => setRole('vendor')}
            className="bg-white rounded-xl shadow-sm p-8 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Store className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">Vendor Account</h2>
              <p className="text-gray-600">
                Are you a wedding vendor? Create an account to showcase your services.
              </p>
            </div>
          </button>
        </div>
      ) : (
        <div className="max-w-md mx-auto">
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    minLength={6}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary pr-10"
                    placeholder="Confirm your password"
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
                  onClick={() => navigate(`/${role}/signin`)}
                  className="text-primary hover:underline font-medium"
                  disabled={loading}
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;