import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase, getUserRole } from '../lib/supabase';
import VendorDashboard from './vendor/VendorDashboard';
import CoupleDashboard from './couple/CoupleDashboard';
import type { Vendor, Couple } from '../types';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'vendor' | 'couple' | null>(null);
  const [userData, setUserData] = useState<Vendor | Couple | null>(null);

  const loadUserData = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        navigate('/auth');
        return;
      }
      
      if (!session?.user) {
        console.log('No session user found');
        navigate('/auth');
        return;
      }

      // Debug: Log session details
      console.log('Session:', { userId: session.user.id, token: session.access_token });

      const role = await getUserRole(); // Updated: No argument needed
      if (!role) {
        console.error('No user role found');
        navigate('/auth');
        return;
      }

      setUserRole(role as 'vendor' | 'couple');

      if (role === 'vendor') {
        try {
          const { data: vendorData, error: vendorError } = await supabase
            .from('vendors')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (vendorError && vendorError.code !== 'PGRST116') {
            console.error('Error fetching vendor profile:', vendorError);
            toast.error('Failed to load vendor profile');
            return;
          }

          setUserData(vendorData || { user_id: session.user.id, slug: '' } as Vendor);
        } catch (error) {
          console.error('Error loading vendor data:', error);
          toast.error('Failed to load vendor profile');
          return;
        }
      } else if (role === 'couple') {
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (coupleError) {
          console.error('Error fetching couple data:', coupleError);
          toast.error('Failed to load couple profile');
          return;
        }

        if (!coupleData) {
          const { data: newCouple, error: createError } = await supabase
            .from('couples')
            .upsert([{
              user_id: session.user.id,
              partner1_name: '',
              partner2_name: '',
              location: '',
              wedding_date: null,
              budget: null,
              created_at: new Date().toISOString(),
              public_profile: false,
              venue: undefined
            }], { onConflict: 'user_id' })
            .select()
            .single();

          if (createError) {
            console.error('Error upserting couple profile:', createError);
            toast.error('Failed to create/update couple profile');
            return;
          }

          setUserData(newCouple);
        } else {
          setUserData(coupleData);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load dashboard data');
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (!userData || !userRole) {
    return null;
  }

  return userRole === 'vendor' 
    ? <VendorDashboard vendor={userData as Vendor} />
    : <CoupleDashboard couple={userData as Couple} />;
};

export default Dashboard;