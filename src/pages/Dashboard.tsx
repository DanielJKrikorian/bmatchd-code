import { useCallback, useEffect, useState } from 'react';
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
      console.log('Dashboard: Starting loadUserData');

      // Fetch session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Dashboard: Session fetched', { session, sessionError });

      if (sessionError) {
        console.error('Dashboard: Session error', sessionError.message);
        toast.error('Failed to authenticate session');
        navigate('/auth');
        return;
      }

      if (!session?.user) {
        console.log('Dashboard: No user in session');
        navigate('/auth');
        return;
      }

      // Fetch user role
      const role = await getUserRole();
      console.log('Dashboard: Role fetched', { role });

      if (!role) {
        console.error('Dashboard: No role found for user', session.user.id);
        toast.error('Unable to determine user role');
        navigate('/auth');
        return;
      }

      setUserRole(role as 'vendor' | 'couple');

      // Load vendor or couple data based on role
      if (role === 'vendor') {
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        console.log('Dashboard: Vendor data fetched', { vendorData, vendorError });

        if (vendorError) {
          if (vendorError.code !== 'PGRST116') {
            console.error('Dashboard: Error fetching vendor profile', vendorError.message);
            toast.error('Failed to load vendor profile');
            return;
          }
        }

        setUserData(vendorData || { user_id: session.user.id, slug: '' } as Vendor);
      } else if (role === 'couple') {
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        console.log('Dashboard: Couple data fetched', { coupleData, coupleError });

        if (coupleError) {
          console.error('Dashboard: Error fetching couple data', coupleError.message);
          toast.error('Failed to load couple profile');
          return;
        }

        if (!coupleData) {
          const { data: newCouple, error: createError } = await supabase
            .from('couples')
            .upsert(
              {
                user_id: session.user.id,
                partner1_name: '',
                partner2_name: '',
                location: '',
                wedding_date: null,
                budget: null,
                created_at: new Date().toISOString(),
                public_profile: false,
                venue: undefined,
              },
              { onConflict: 'user_id' }
            )
            .select()
            .single();

          console.log('Dashboard: New couple created', { newCouple, createError });

          if (createError) {
            console.error('Dashboard: Error creating couple profile', createError.message);
            toast.error('Failed to create/update couple profile');
            return;
          }

          setUserData(newCouple);
        } else {
          setUserData(coupleData);
        }
      }

      console.log('Dashboard: User data loaded successfully');
    } catch (error) {
      console.error('Dashboard: Uncaught error in loadUserData', error);
      toast.error('Failed to load dashboard data');
      navigate('/auth');
    } finally {
      setLoading(false);
      console.log('Dashboard: loadUserData completed');
    }
  }, [navigate]); // Dependency array only includes navigate

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
    return null; // Redirect handled by navigate in loadUserData
  }

  return userRole === 'vendor' ? (
    <VendorDashboard vendor={userData as Vendor} />
  ) : (
    <CoupleDashboard couple={userData as Couple} />
  );
};

export default Dashboard;