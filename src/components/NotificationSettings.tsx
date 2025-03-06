import React, { useState, useEffect } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface NotificationPreferences {
  new_message: boolean;
  new_review: boolean;
  new_booking: boolean;
  new_lead: boolean;
  appointment_updates: boolean;
  marketing_emails: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  new_message: true,
  new_review: true,
  new_booking: true,
  new_lead: true,
  appointment_updates: true,
  marketing_emails: true
};

const NotificationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to get existing preferences
      const { data: existingPrefs, error: fetchError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError && !fetchError.message.includes('No rows found')) {
        throw fetchError;
      }

      if (!existingPrefs) {
        // Create new preferences if none exist
        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert([{ 
            user_id: user.id, 
            ...DEFAULT_PREFERENCES 
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newPrefs);
      } else {
        setPreferences(existingPrefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Don't show error toast, just use defaults
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences) => {
    try {
      setSaving(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newValue = !preferences[key];
      
      // Try to update existing preferences
      const { error: updateError } = await supabase
        .from('notification_preferences')
        .update({ [key]: newValue })
        .eq('user_id', user.id);

      if (updateError) {
        // If update fails, try to insert new preferences
        const { error: insertError } = await supabase
          .from('notification_preferences')
          .insert([{ 
            user_id: user.id, 
            ...DEFAULT_PREFERENCES,
            [key]: newValue 
          }]);

        if (insertError) throw insertError;
      }

      setPreferences(prev => ({
        ...prev,
        [key]: newValue
      }));

      toast.success('Preferences updated');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
      // Revert the local state
      setPreferences(prev => ({
        ...prev,
        [key]: !preferences[key]
      }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Notification Settings</h3>
          <p className="text-sm text-gray-500">Manage your email notifications</p>
        </div>
        <Bell className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {[
          {
            key: 'new_message' as const,
            label: 'New Messages',
            description: 'Get notified when you receive new messages'
          },
          {
            key: 'appointment_updates' as const,
            label: 'Appointment Updates',
            description: 'Get notified about changes to your appointments'
          },
          {
            key: 'new_booking' as const,
            label: 'Booking Confirmations',
            description: 'Get notified when a booking is confirmed'
          },
          {
            key: 'marketing_emails' as const,
            label: 'Marketing Emails',
            description: 'Receive updates about new features and special offers'
          }
        ].map((setting) => (
          <div key={setting.key} className="flex items-start space-x-4">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <label htmlFor={setting.key} className="font-medium text-gray-700">
                  {setting.label}
                </label>
                <button
                  type="button"
                  role="switch"
                  id={setting.key}
                  aria-checked={preferences[setting.key]}
                  onClick={() => handleToggle(setting.key)}
                  disabled={saving}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full
                    transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50
                    ${preferences[setting.key] ? 'bg-primary' : 'bg-gray-200'}
                    ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${preferences[setting.key] ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">{setting.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationSettings;