import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  type: 'message' | 'review' | 'booking' | 'lead' | 'lead_status' | 'appointment';
  title: string;
  content?: string;
  link?: string;
  created_at: string;
  read: boolean;
  message_id?: string;
  lead_id?: string;
  appointment_id?: string;
  review_id?: string;
}

const NotificationBell = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVendor, setIsVendor] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel>>();

  useEffect(() => {
    checkUserRole();
    
    // Handle clicks outside dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      subscriptionRef.current?.unsubscribe();
    };
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is a vendor
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role === 'vendor') {
        setIsVendor(true);
        loadActivities();
        subscribeToActivities(user.id);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const loadActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (vendorData) {
        const { data, error } = await supabase
          .from('vendor_activities')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        setActivities(data || []);
        setUnreadCount(data?.filter(activity => !activity.read).length || 0);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const subscribeToActivities = (userId: string) => {
    subscriptionRef.current = supabase.channel('activities')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vendor_activities' },
        payload => {
          setActivities(prev => [payload.new as Activity, ...prev.slice(0, 9)]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();
  };

  const markAsRead = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('vendor_activities')
        .update({ read: true })
        .eq('id', activityId);

      if (error) throw error;

      setActivities(prev =>
        prev.map(activity =>
          activity.id === activityId ? { ...activity, read: true } : activity
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking activity as read:', error);
    }
  };

  const handleActivityClick = (activity: Activity) => {
    if (!activity.read) {
      markAsRead(activity.id);
    }

    // Navigate based on activity type
    switch (activity.type) {
      case 'message':
        navigate('/vendor/messages');
        break;
      case 'lead':
      case 'lead_status':
        navigate('/vendor/leads');
        break;
      case 'review':
        navigate('/reviews');
        break;
      case 'booking':
      case 'appointment':
        navigate('/calendar');
        break;
      default:
        if (activity.link) {
          navigate(activity.link);
        }
    }
    
    setShowDropdown(false);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message':
        return 'text-blue-500';
      case 'review':
        return 'text-yellow-500';
      case 'booking':
        return 'text-green-500';
      case 'lead':
        return 'text-primary';
      case 'lead_status':
        return 'text-green-500';
      case 'appointment':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };

  // Only render for vendors
  if (!isVendor) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-[80vh] overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
          </div>
          <div className="divide-y">
            {activities.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              activities.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => handleActivityClick(activity)}
                  className={`w-full p-4 text-left hover:bg-gray-50 ${
                    !activity.read ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Bell className={`w-5 h-5 mt-0.5 ${getActivityIcon(activity.type)}`} />
                    <div>
                      <p className={`${!activity.read ? 'font-medium' : ''}`}>
                        {activity.title}
                      </p>
                      {activity.content && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {activity.content}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;