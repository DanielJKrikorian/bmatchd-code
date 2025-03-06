//interface User {
//  id: string;
//  email: string;
//  role: 'couple' | 'vendor' | 'admin';
//}

export interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  category: string;
  description: string;
  location: string;
  price_range: string;
  rating: number;
  images: string[];
  videos: string[];
  subscription_plan?: 'essential' | 'featured' | 'elite' | null;
  subscription_end_date?: string | null;
  created_at: string;
  packages?: Package[];
  package_limit: number;
  slug: string; // Added
}

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

export interface Couple {
  id: string;
  user_id: string;
  partner1_name: string;
  partner2_name: string;
  wedding_date: string | null;
  budget: number | null;
  location: string;
  created_at: string;
  public_profile: boolean; // Added
  venue?: string; // Added
}

export interface SubscriptionPlan {
  id: 'essential' | 'featured' | 'elite';
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  badge?: string;
  priceId: {
    monthly: string;
    yearly: string;
  };
}