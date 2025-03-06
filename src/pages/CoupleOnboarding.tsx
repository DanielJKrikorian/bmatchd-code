import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, Calendar, BellRing as Ring, MapPin, DollarSign, ArrowRight, Users2, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'react-hot-toast';
import CitySelect from '../components/CitySelect';
import MediaUpload from '../components/MediaUpload'; // Added
import { supabase } from '../lib/supabase';

interface OnboardingData {
  partner1Name: string;
  partner2Name: string;
  weddingDate: string;
  budget: string;
  selectedCities: string[];
  interests: string[];
  howWeMet: string;
  proposal: string;
  images: string[]; // Added
  videos: string[]; // Added
  primaryImage: number; // Added
}

const CoupleOnboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    partner1Name: '',
    partner2Name: '',
    weddingDate: '',
    budget: '',
    selectedCities: [],
    interests: [],
    howWeMet: '',
    proposal: '',
    images: [],
    videos: [],
    primaryImage: 0,
  });

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        localStorage.setItem('coupleOnboardingData', JSON.stringify(formData));
        navigate('/auth', { 
          state: { 
            returnTo: '/couple/onboarding',
            role: 'couple',
            preferences: formData
          }
        });
        return;
      }

      const savedData = localStorage.getItem('coupleOnboardingData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setFormData(prev => ({ ...prev, ...parsedData }));
        } catch (e) {
          console.error('Error parsing saved data:', e);
        }
      }

      const { data: coupleData, error } = await supabase
        .from('couples')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && !error.message.includes('0 rows')) {
        throw error;
      }

      if (coupleData) {
        setFormData(prev => ({
          ...prev,
          partner1Name: coupleData.partner1_name || '',
          partner2Name: coupleData.partner2_name || '',
          weddingDate: coupleData.wedding_date || '',
          budget: coupleData.budget?.toString() || '',
          howWeMet: coupleData.how_we_met || '',
          proposal: coupleData.proposal_story || '',
          images: coupleData.images || [],
          videos: coupleData.videos || [],
          primaryImage: coupleData.primary_image || 0,
        }));
        if (coupleData.partner1_name && coupleData.partner2_name) {
          setStep(2);
        }
      } else {
        await supabase
          .from('couples')
          .upsert({
            id: crypto.randomUUID(),
            user_id: user.id,
            partner1_name: 'TBD',
            partner2_name: 'TBD',
            location: 'TBD'
          }, { onConflict: 'user_id' });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('couples')
          .upsert({
            user_id: user.id,
            partner1_name: formData.partner1Name || 'TBD',
            partner2_name: formData.partner2Name || 'TBD',
            location: formData.selectedCities[0] || 'TBD',
            wedding_date: formData.weddingDate || null,
            budget: formData.budget ? parseFloat(formData.budget) : null,
            how_we_met: formData.howWeMet || null,
            proposal_story: formData.proposal || null,
            images: formData.images,
            videos: formData.videos,
            primary_image: formData.primaryImage,
          }, { onConflict: 'user_id' });

        if (error) throw error;

        localStorage.removeItem('coupleOnboardingData');
        toast.success('Profile created successfully!');
        navigate('/vendors');
      } else {
        localStorage.setItem('coupleOnboardingData', JSON.stringify(formData));
        navigate('/auth', { 
          state: { 
            returnTo: '/couple/onboarding',
            role: 'couple',
            preferences: formData
          }
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ring className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to BMATCHD</h1>
          <p className="text-xl text-gray-600">Let's start planning your perfect wedding</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <div className="flex justify-between">
              {[1, 2, 3, 4, 5, 6].map((stepNumber) => ( // Added step 6
                <div
                  key={stepNumber}
                  className={`flex items-center ${stepNumber < 6 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step >= stepNumber
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {stepNumber}
                  </div>
                  {stepNumber < 6 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step > stepNumber ? 'bg-primary' : 'bg-gray-100'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            {step === 1 ? (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">Start Your Wedding Journey</h2>
                  <p className="text-gray-600 max-w-lg mx-auto">
                    Join thousands of couples who found their perfect wedding vendors through BMATCHD
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-primary/5 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Heart className="w-6 h-6 text-primary mr-3" />
                      <h3 className="font-semibold">Find Perfect Matches</h3>
                    </div>
                    <p className="text-gray-600">
                      Our smart matching system helps you discover vendors that match your style and budget
                    </p>
                  </div>

                  <div className="bg-primary/5 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Star className="w-6 h-6 text-primary mr-3" />
                      <h3 className="font-semibold">Read Real Reviews</h3>
                    </div>
                    <p className="text-gray-600">
                      Get insights from other couples who've worked with vendors
                    </p>
                  </div>

                  <div className="bg-primary/5 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Calendar className="w-6 h-6 text-primary mr-3" />
                      <h3 className="font-semibold">Easy Planning</h3>
                    </div>
                    <p className="text-gray-600">
                      Keep track of appointments, bookings, and your wedding timeline
                    </p>
                  </div>

                  <div className="bg-primary/5 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Sparkles className="w-6 h-6 text-primary mr-3" />
                      <h3 className="font-semibold">Special Perks</h3>
                    </div>
                    <p className="text-gray-600">
                      Get exclusive deals and offers from top wedding vendors
                    </p>
                  </div>
                </div>
              </div>
            ) : step === 2 ? (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Tell Us About You</h2>
                  <p className="text-gray-600">Let's personalize your wedding planning experience</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Partner 1 Name
                    </label>
                    <input
                      type="text"
                      name="partner1Name"
                      required
                      value={formData.partner1Name}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Enter name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Partner 2 Name
                    </label>
                    <input
                      type="text"
                      name="partner2Name"
                      required
                      value={formData.partner2Name}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Enter name"
                    />
                  </div>
                </div>
              </div>
            ) : step === 3 ? (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Your Love Story</h2>
                  <p className="text-gray-600">Share your journey with us</p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      How did you meet?
                    </label>
                    <textarea
                      name="howWeMet"
                      value={formData.howWeMet}
                      onChange={handleChange}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Tell us your story..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      The Proposal
                    </label>
                    <textarea
                      name="proposal"
                      value={formData.proposal}
                      onChange={handleChange}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="How did the proposal happen?"
                    />
                  </div>
                </div>
              </div>
            ) : step === 4 ? (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Wedding Details</h2>
                  <p className="text-gray-600">Help us find the perfect vendors for your big day</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Wedding Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="weddingDate"
                      value={formData.weddingDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Budget Range (Optional)
                    </label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Select budget range</option>
                      <option value="15000">Under $15,000</option>
                      <option value="25000">$15,000 - $25,000</option>
                      <option value="35000">$25,000 - $35,000</option>
                      <option value="50000">$35,000 - $50,000</option>
                      <option value="75000">$50,000 - $75,000</option>
                      <option value="100000">$75,000 - $100,000</option>
                      <option value="150000">$100,000 - $150,000</option>
                      <option value="200000">$150,000 - $200,000</option>
                      <option value="250000">Over $200,000</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Location Preferences
                    </label>
                    <CitySelect
                      selectedCities={formData.selectedCities}
                      onChange={(cities) => setFormData(prev => ({ ...prev, selectedCities: cities }))}
                    />
                  </div>
                </div>
              </div>
            ) : step === 5 ? (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">What are you looking for?</h2>
                  <p className="text-gray-600">Select the services you're interested in</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    'Venues', 'Photography', 'Videography', 'Wedding Planning', 'Catering', 'Bakery', 'Florist',
                    'Music & Entertainment', 'DJ Services', 'Wedding Bands', 'Bridal Wear', 'Groom Wear', 'Jewelry',
                    'Hair & Makeup', 'Transportation', 'Invitations & Stationery', 'Decor & Rentals', 'Lighting',
                    'Photo Booth', 'Wedding Favors', 'Officiants', 'Dance Instruction', 'Travel & Honeymoon', 'Wedding Insurance'
                  ].map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        formData.interests.includes(interest)
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Add Your Photos & Videos</h2>
                  <p className="text-gray-600">Share your special moments</p>
                </div>

                <MediaUpload
                  images={formData.images}
                  videos={formData.videos}
                  primaryImage={formData.primaryImage}
                  onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
                  onVideosChange={(videos) => setFormData(prev => ({ ...prev, videos }))}
                  onPrimaryChange={(index) => setFormData(prev => ({ ...prev, primaryImage: index }))}
                  userRole="couple"
                />
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(prev => prev - 1)}
                >
                  Back
                </Button>
              )}
              <div className="ml-auto">
                <Button
                  onClick={step === 6 ? handleSubmit : () => setStep(prev => prev + 1)}
                  disabled={submitting || (step === 2 && (!formData.partner1Name || !formData.partner2Name))}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating Profile...
                    </>
                  ) : step === 1 ? (
                    <>
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : step === 6 ? (
                    <>
                      Start Finding Vendors
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoupleOnboarding;