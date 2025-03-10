import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, MessageSquare, UserCircle, Heart, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
// import NotificationBell from './NotificationBell'; // Comment out

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<'vendor' | 'couple' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchUserRole = async (userId: string, userMetadata: any) => {
    if (userMetadata?.role) {
      console.log('Navbar: Using role from metadata:', userMetadata.role);
      return userMetadata.role;
    }

    let attempts = 0;
    const maxAttempts = 3;
    const delay = 2000;

    while (attempts < maxAttempts) {
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role (attempt ' + (attempts + 1) + '):', error);
        if (attempts === maxAttempts - 1) return null;
      }

      if (userData?.role) {
        console.log('Navbar: Role fetched from users table:', userData.role);
        if (userData.role === 'vendor') {
          const { data: vendorData, error: vendorError } = await supabase
            .from('vendors')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          if (vendorError || !vendorData) {
            console.error('Error fetching vendor data:', vendorError);
            return null;
          }
          console.log('Navbar: Vendor authenticated');
          return 'vendor';
        } else if (userData.role === 'couple') {
          console.log('Navbar: Couple authenticated');
          return 'couple';
        }
        return null;
      }

      attempts++;
      if (attempts < maxAttempts) {
        console.log(`Navbar: Role not found, retrying (${attempts}/${maxAttempts})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    console.error('Navbar: Max retry attempts reached, role not found in users table');
    return null;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      console.log('Navbar Initial Session:', {
        session: data.session,
        user: data.session?.user,
        token: data.session?.access_token,
        error: error?.message,
      });
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Navbar: Auth state changed:', {
        event,
        user: session?.user,
        token: session?.access_token,
        currentPath: location.pathname,
      });

      if (session?.user) {
        setIsAuthenticated(true);
        const role = await fetchUserRole(session.user.id, session.user.user_metadata);
        setUserRole(role);
        if (event === 'INITIAL_SESSION' && role === 'vendor' && location.pathname === '/') {
          navigate('/dashboard');
        }
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
        console.log('Navbar: No user authenticated');
        const protectedRoutes = [
          '/dashboard',
          '/vendor/messages',
          '/couple/messages',
          '/saved-vendors',
          '/couple/wedding-team',
        ];
        if (protectedRoutes.includes(location.pathname) && location.pathname !== '/signin') {
          navigate('/signin');
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const handleNavigate = (path: string) => {
    console.log(`Navbar: Navigating to ${path}`);
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUserRole(null);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="https://rtzrhxxdqmnpydskixso.supabase.co/storage/v1/object/public/public_1//BMatchd-no-tag.png"
              alt="BMATCHD"
              className="h-16 w-auto"
            />
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/vendors" className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
              <Search className="w-4 h-4" />
              <span>Find Vendors</span>
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to={userRole === 'vendor' ? '/vendor/messages' : '/couple/messages'}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Messages</span>
                </Link>
                <Link to="/dashboard" className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
                  <UserCircle className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={() => handleNavigate('/signin')}>
                  Sign In
                </Button>
                <Button onClick={() => handleNavigate('/get-started')}>Get Started</Button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                {userRole === 'couple' && (
                  <>
                    <Link to="/saved-vendors">
                      <Button variant="ghost" className="flex items-center space-x-2">
                        <Heart className="w-4 h-4" />
                        <span>Saved</span>
                      </Button>
                    </Link>
                    <Link to="/couple/wedding-team">
                      <Button variant="ghost" className="flex items-center space-x-2">
                        <UserCircle className="w-4 h-4" />
                        <span>Wedding Team</span>
                      </Button>
                    </Link>
                  </>
                )}
                {/* {userRole === 'vendor' && <NotificationBell />} */} {/* Comment out */}
                <Button variant="ghost" onClick={handleLogout}>
                  Sign Out
                </Button>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 bg-white z-50 overflow-y-auto">
            <div className="py-4 space-y-1 px-4">
              <Link
                to="/vendors"
                className="block px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center space-x-3">
                  <Search className="w-5 h-5" />
                  <span>Find Vendors</span>
                </div>
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to={userRole === 'vendor' ? '/vendor/messages' : '/couple/messages'}
                    className="block px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="w-5 h-5" />
                      <span>Messages</span>
                    </div>
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <UserCircle className="w-5 h-5" />
                      <span>Dashboard</span>
                    </div>
                  </Link>
                  {userRole === 'couple' && (
                    <>
                      <Link
                        to="/saved-vendors"
                        className="block px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="flex items-center space-x-3">
                          <Heart className="w-5 h-5" />
                          <span>Saved Vendors</span>
                        </div>
                      </Link>
                      <Link
                        to="/couple/wedding-team"
                        className="block px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="flex items-center space-x-3">
                          <UserCircle className="w-5 h-5" />
                          <span>Wedding Team</span>
                        </div>
                      </Link>
                    </>
                  )}
                  {/* {userRole === 'vendor' && (
                    <div className="block px-4 py-3 text-gray-600">
                      <NotificationBell />
                    </div>
                  )} */} {/* Comment out */}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <X className="w-5 h-5" />
                      <span>Sign Out</span>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNavigate('/signin')}
                    className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleNavigate('/get-started')}
                    className="w-full text-left px-4 py-3 bg-primary text-white rounded-md mt-2"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;