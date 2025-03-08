import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Facebook, Instagram, Mail, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const Footer = () => {
  const navigate = useNavigate();
  const [showCopied, setShowCopied] = useState(false);

  const handleAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if user is already an admin
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userData?.role === 'admin') {
          navigate('/admin/dashboard');
          return;
        }
      }

      // If not admin, prompt for PIN
      const pin = prompt('Enter admin PIN:');
      if (!pin) return;

      // Verify PIN
      const { data, error } = await supabase.rpc('verify_admin_pin', { 
        pin_to_verify: pin 
      });

      if (error) {
        console.error('Error verifying PIN:', error);
        toast.error('Failed to verify PIN');
        return;
      }

      if (!data.valid) {
        toast.error('Invalid PIN');
        return;
      }

      // Sign in as admin
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@bmatchd.com',
        password: 'Admin123!'
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        toast.error('Failed to sign in as admin');
        return;
      }

      toast.success('Welcome to Admin Dashboard');
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Admin access error:', error);
      toast.error('Failed to access admin area');
    }
  };

  return (
    <footer className="bg-white border-t mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="https://rtzrhxxdqmnpydskixso.supabase.co/storage/v1/object/public/public_1//bmatchd-logo.png"
                alt="BMATCHD"
                className="h-36 w-auto"
              />
            </Link>
            <p className="text-gray-600">
              Connecting couples with their perfect wedding vendors.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.facebook.com/bmatchd" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-gray-600"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://www.instagram.com/bmatchd" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-gray-600"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://www.tiktok.com/@bmatchd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600"
              >
                <img 
                  src="https://rtzrhxxdqmnpydskixso.supabase.co/storage/v1/object/public/public_1//icons8-tiktok-150.png"
                  alt="TikTok"
                  className="w-5 h-5"
                />
              </a>
              <Link 
                to="/help#contact" 
                className="text-gray-400 hover:text-gray-600"
              >
                <Mail className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Empty Middle Column (Spacer) */}
          <div></div>

          {/* Support (Moved to Far Right) */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/help" className="text-gray-600 hover:text-primary">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/help#contact" className="text-gray-600 hover:text-primary">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-600 hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/vendor/ambassador" className="text-gray-600 hover:text-primary">
                  Ambassador Program
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              © {new Date().getFullYear()} Events Hub Inc. All rights reserved.
            </p>
            <button 
              onClick={handleAdminAccess}
              className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm"
              title="Admin Access"
            >
              <Shield className="w-4 h-4" />
              <span className="sr-only">Admin Access</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;