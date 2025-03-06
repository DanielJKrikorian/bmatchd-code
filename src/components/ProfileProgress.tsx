import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Crown, Package, Eye } from 'lucide-react';
import { Button } from './ui/button';
import type { Vendor } from '../types';

interface ProfileProgressProps {
  vendor: Vendor;
}

const ProfileProgress: React.FC<ProfileProgressProps> = ({ vendor }) => {
  const getProfileCompletion = () => {
    let completed = 0;
    let total = 0;

    // Required fields
    const requiredFields: (keyof Vendor)[] = [
      'business_name',
      'category',
      'description',
      'location',
      'email',
      'phone'
    ];

    // Optional fields
    const optionalFields: (keyof Vendor)[] = [
      'website_url',
      'facebook_url',
      'instagram_url',
      'tiktok_url',
      'youtube_url'
    ];

    // Check required fields
    requiredFields.forEach(field => {
      total++;
      if (vendor[field] && vendor[field].toString().trim() !== '') {
        completed++;
      }
    });

    // Check optional fields
    optionalFields.forEach(field => {
      total++;
      if (vendor[field] && vendor[field].toString().trim() !== '') {
        completed++;
      }
    });

    // Check images
    total++;
    if (vendor.images && vendor.images.length > 0) {
      completed++;
    }

    // Check packages
    total++;
    if (vendor.packages && vendor.packages.length > 0) {
      completed++;
    }

    // Check subscription
    total++;
    if (vendor.subscription_plan) {
      completed++;
    }

    return {
      percentage: Math.round((completed / total) * 100),
      completed,
      total,
      hasSubscription: !!vendor.subscription_plan
    };
  };

  const progress = getProfileCompletion();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold">Complete Your Profile</h2>
          <p className="text-gray-600">
            A complete profile helps you attract more couples
          </p>
        </div>
        <div className="flex gap-2">
          {!progress.hasSubscription && (
            <Link to="/subscription">
              <Button variant="outline">
                <Crown className="w-4 h-4 mr-2" />
                Choose Plan
              </Button>
            </Link>
          )}
          <Button 
            variant="outline"
            onClick={() => window.open(`/vendors/${vendor.id}/preview`, '_blank')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={() => window.location.href = '/vendor/settings'}>
            <Settings className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{progress.percentage}% Complete</span>
          <span className="text-gray-600">
            {progress.completed} of {progress.total} items
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="mt-4 space-y-2">
        {[
          {
            label: 'Basic Information',
            completed: !!vendor.business_name && !!vendor.category && !!vendor.description && !!vendor.location
          },
          {
            label: 'Contact Information',
            completed: !!vendor.email && !!vendor.phone
          },
          {
            label: 'Gallery Images',
            completed: vendor.images && vendor.images.length > 0
          },
          {
            label: 'Service Packages',
            completed: vendor.packages && vendor.packages.length > 0,
            link: '/vendor/packages'
          },
          {
            label: 'Social Media Links',
            completed: Object.entries({
              website_url: vendor.website_url,
              facebook_url: vendor.facebook_url,
              instagram_url: vendor.instagram_url,
              tiktok_url: vendor.tiktok_url,
              youtube_url: vendor.youtube_url
            }).some(([_, value]) => value)
          },
          {
            label: 'Subscription Plan',
            completed: !!vendor.subscription_plan
          }
        ].map((item, index) => (
          <div key={index} className="flex items-center text-sm">
            <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${
              item.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                item.completed ? 'bg-green-600' : 'bg-gray-400'
              }`} />
            </div>
            {item.link ? (
              <Link 
                to={item.link}
                className={`hover:text-primary ${item.completed ? 'text-gray-900' : 'text-gray-500'}`}
              >
                {item.label}
                {item.label === 'Service Packages' && (
                  <Package className="w-4 h-4 ml-1 inline-block" />
                )}
              </Link>
            ) : (
              <span className={item.completed ? 'text-gray-900' : 'text-gray-500'}>
                {item.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileProgress;