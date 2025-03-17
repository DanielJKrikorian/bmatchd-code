import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, MapPin, DollarSign, Star, MessageSquare, Globe, Facebook, Instagram, Youtube, Loader2, Send, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface Review {
  id: string;
  vendor_id: string;
  couple_id: string | null;
  rating: number;
  content: string;
  created_at: string;
  response: string | null;
  response_date: string | null;
  reviewer_name: string | null;
  reviewer_email: string | null;
  couple: { partner1_name: string; partner2_name: string }[] | null;
}

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  slug: string;
  description: string;
  location: string;
  price_range: string;
  rating: number;
  images: string[];
  primary_image: number;
  videos: { url: string; thumbnailTime: number }[];
  website_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  youtube_url?: string;
}

interface User {
  id: string;
  email?: string;
}

const VendorProfile = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userRole, setUserRole] = useState<'couple' | 'vendor' | null>(null);
  const [userCoupleId, setUserCoupleId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    content: '',
    reviewerName: '',
    reviewerEmail: '',
  });
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [inquiryForm, setInquiryForm] = useState({
    partner1Name: '',
    partner2Name: '',
    email: '',
    phone: '',
    weddingDate: '',
    budget: '',
    guestCount: '',
    venueLocation: '',
    message: '',
    preferredContactMethod: 'email' as 'email' | 'phone',
    servicePackage: '',
    timeframe: '',
  });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  const reviewsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!slug) {
      navigate('/vendors');
      return;
    }
    loadVendorData();
  }, [slug, navigate]);

  const loadVendorData = async () => {
    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select(`
          id, user_id, business_name, slug, description, location, price_range, rating,
          images, primary_image, videos,
          website_url, facebook_url, instagram_url, youtube_url,
          reviews (
            id, vendor_id, couple_id, rating, content, response, response_date, created_at,
            reviewer_name, reviewer_email,
            couple:couples (partner1_name, partner2_name)
          ),
          vendor_packages (id, name, description, price, features)
        `)
        .eq('slug', slug)
        .single();

      if (vendorError) throw vendorError;
      if (!vendorData) {
        toast.error('Vendor not found');
        navigate('/vendors');
        return;
      }

      setVendor(vendorData);
      setReviews((vendorData.reviews || []).map(review => ({
        ...review,
        couple: review.couple && review.couple.length > 0 ? review.couple as { partner1_name: string; partner2_name: string }[] : null,
      })));

      const { data: packagesData, error: packagesError } = await supabase
        .from('vendor_packages')
        .select('*')
        .eq('vendor_id', vendorData.id);
      if (packagesError) throw packagesError;
      setPackages(packagesData || []);

      const { error: viewError } = await supabase
        .from('vendor_profile_views')
        .insert([{ vendor_id: vendorData.id }]);
      if (viewError) console.error('[LOAD] Error tracking view:', viewError);

      const { data: authUser } = await supabase.auth.getUser();
      if (authUser.user) {
        setUser(authUser.user);
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', authUser.user.id)
          .single();
        if (userError) throw userError;
        setUserRole(userData?.role);

        if (userData?.role === 'couple') {
          const { data: coupleData, error: coupleError } = await supabase
            .from('couples')
            .select('id, partner1_name, partner2_name, wedding_date, budget')
            .eq('user_id', authUser.user.id)
            .single();
          if (coupleError) throw coupleError;
          if (coupleData) {
            setUserCoupleId(coupleData.id);
            setInquiryForm(prev => ({
              ...prev,
              partner1Name: coupleData.partner1_name || '',
              partner2Name: coupleData.partner2_name || '',
              email: authUser.user.email || '',
              weddingDate: coupleData.wedding_date || '',
              budget: coupleData.budget?.toString() || '',
            }));
            const { data: savedVendor } = await supabase
              .from('saved_vendors')
              .select('id')
              .eq('couple_id', coupleData.id)
              .eq('vendor_id', vendorData.id)
              .maybeSingle();
            setIsSaved(!!savedVendor);
          }
        }
      }
    } catch (error) {
      console.error('[LOAD] Error:', error);
      toast.error('Failed to load vendor profile');
      setError('Unable to load this vendor profile.');
      navigate('/vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userCoupleId) {
      toast.error('Please log in as a couple to save vendors');
      return;
    }
    setSavingFavorite(true);
    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_vendors')
          .delete()
          .eq('couple_id', userCoupleId)
          .eq('vendor_id', vendor!.id);
        if (error) throw error;
        setIsSaved(false);
        toast.success('Removed from saved vendors');
      } else {
        const { error } = await supabase
          .from('saved_vendors')
          .insert([{ couple_id: userCoupleId, vendor_id: vendor!.id }]);
        if (error) throw error;
        setIsSaved(true);
        toast.success('Added to saved vendors');
      }
    } catch (error) {
      console.error('[SAVE] Error:', error);
      toast.error('Failed to update saved vendors');
    } finally {
      setSavingFavorite(false);
    }
  };

  const handleInquiryClick = () => {
    if (!user) {
      navigate('/signin');
    } else if (userRole === 'couple') {
      setShowInquiryModal(true);
    } else {
      toast.error('Please log in as a couple to inquire');
      navigate('/signin');
    }
  };

  const handleInquiryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setInquiryForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNextStep = () => {
    const step = steps[currentStep];
    const requiredFields = step.fields.filter(f => ['partner1Name', 'partner2Name', 'email', 'servicePackage', 'timeframe', 'message'].includes(f));
    const isValid = requiredFields.every(field => inquiryForm[field as keyof typeof inquiryForm]);
    if (!isValid) {
      toast.error('Please fill out all required fields');
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => setCurrentStep(prev => prev - 1);

  const submitInquiry = async () => {
    setSubmittingInquiry(true);
    try {
      const selectedPackage = packages.find(pkg => pkg.id === inquiryForm.servicePackage);
      const packageName = selectedPackage ? selectedPackage.name : inquiryForm.servicePackage === 'Custom Package' ? 'Custom Package' : '';
      const messageId = crypto.randomUUID();
      const now = new Date().toISOString();

      const inquiry = {
        vendor_id: vendor!.id,
        couple_id: userCoupleId,
        message_id: messageId,
        wedding_date: inquiryForm.weddingDate || null,
        budget: inquiryForm.budget ? parseFloat(inquiryForm.budget) : null,
        guest_count: inquiryForm.guestCount ? parseInt(inquiryForm.guestCount, 10) : null,
        venue_location: inquiryForm.venueLocation || null,
        inquiry_type: packageName || null,
        additional_details: `
Service Package: ${packageName}
Planning Timeframe: ${inquiryForm.timeframe}
Preferred Contact: ${inquiryForm.preferredContactMethod}
Phone: ${inquiryForm.phone || 'Not provided'}

Message:
${inquiryForm.message}
        `.trim() || null,
        status: 'pending',
      };

      const { error: leadError } = await supabase.from('leads').insert([inquiry]);
      if (leadError) throw leadError;

      // Step 1: Check for an existing thread or create a new one
      let threadId;
      const { data: existingThread, error: fetchThreadError } = await supabase
        .from('message_threads')
        .select('id')
        .eq('vendor_id', vendor!.id)
        .eq('couple_id', userCoupleId)
        .maybeSingle();

      if (fetchThreadError && fetchThreadError.code !== 'PGRST116') throw fetchThreadError; // PGRST116 = no rows found

      if (existingThread) {
        threadId = existingThread.id;
        // Update last_message_at for the existing thread
        const { error: updateThreadError } = await supabase
          .from('message_threads')
          .update({ last_message_at: now })
          .eq('id', threadId);
        if (updateThreadError) throw updateThreadError;
      } else {
        threadId = crypto.randomUUID();
        const thread = {
          id: threadId,
          vendor_id: vendor!.id,
          couple_id: userCoupleId,
          last_message_at: now,
          created_at: now,
          thread_status: 'active',
        };
        const { error: threadError } = await supabase.from('message_threads').insert([thread]);
        if (threadError) throw threadError;
      }

      // Step 2: Insert the message with the thread ID
      const message = {
        id: crypto.randomUUID(),
        sender_id: user!.id,
        receiver_id: vendor!.user_id,
        content: inquiryForm.message,
        message_thread_id: threadId,
        status: 'pending',
        created_at: now,
      };

      const { error: messageError } = await supabase.from('messages').insert([message]);
      if (messageError) throw messageError;

      toast.success('Inquiry sent successfully!');
      setShowInquiryModal(false);
      setCurrentStep(0);
    } catch (error) {
      console.error('[INQUIRY] Error:', error);
      toast.error('Failed to send inquiry');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const handleReviewChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReviewForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const setRating = (rating: number) => {
    setReviewForm(prev => ({ ...prev, rating }));
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewForm.rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!reviewForm.content) {
      toast.error('Please enter a review comment');
      return;
    }
    if (!user && !reviewForm.reviewerEmail) {
      toast.error('Please enter your email for anonymous reviews');
      return;
    }
    setSubmittingReview(true);

    try {
      const reviewData: Partial<Review> = {
        vendor_id: vendor!.id,
        rating: reviewForm.rating,
        content: reviewForm.content,
      };

      if (user && userRole === 'couple' && userCoupleId) {
        reviewData.couple_id = userCoupleId;
      } else {
        reviewData.reviewer_name = reviewForm.reviewerName || 'Anonymous';
        reviewData.reviewer_email = reviewForm.reviewerEmail.trim();
      }

      const { error } = await supabase.from('reviews').insert([reviewData]);
      if (error) throw error;

      toast.success('Review submitted!');
      setReviewForm({ rating: 0, content: '', reviewerName: '', reviewerEmail: '' });
      loadVendorData();
    } catch (error) {
      console.error('[SUBMIT] Error:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const ReviewActions = ({ review }: { review: Review }) => {
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({
      rating: review.rating,
      content: review.content,
      reviewerEmail: '',
    });

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const submitEdit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        let query = supabase.from('reviews').update({ 
          rating: editForm.rating, 
          content: editForm.content 
        }).eq('id', review.id);

        if (review.couple_id) {
          if (!userCoupleId || review.couple_id !== userCoupleId) {
            toast.error('You can only edit your own reviews');
            return;
          }
          query = query.eq('couple_id', userCoupleId);
        } else {
          if (!editForm.reviewerEmail) {
            toast.error('Please enter your email to edit');
            return;
          }
          query = query.eq('reviewer_email', editForm.reviewerEmail.trim());
        }

        const { data, error } = await query.select();
        if (error) throw error;
        if (data.length === 0) {
          toast.error(review.couple_id ? 'Unauthorized edit' : 'Email mismatch');
          return;
        }

        toast.success('Review updated!');
        setEditMode(false);
        loadVendorData();
      } catch (error) {
        console.error('[EDIT] Error:', error);
        toast.error('Failed to update review');
      }
    };

    const handleDelete = async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!confirm('Are you sure you want to delete this review?')) return;
      try {
        let query = supabase.from('reviews').delete().eq('id', review.id);

        if (review.couple_id) {
          if (!userCoupleId || review.couple_id !== userCoupleId) {
            toast.error('You can only delete your own reviews');
            return;
          }
          query = query.eq('couple_id', userCoupleId);
        } else {
          if (!editForm.reviewerEmail) {
            toast.error('Please enter your email to delete');
            return;
          }
          query = query.eq('reviewer_email', editForm.reviewerEmail.trim());
        }

        const { error } = await query;
        if (error) throw error;

        toast.success('Review deleted!');
        setEditMode(false);
        loadVendorData();
      } catch (error) {
        console.error('[DELETE] Error:', error);
        toast.error('Failed to delete review');
      }
    };

    return (
      <div className="mt-2">
        {!editMode ? (
          <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
            Edit
          </Button>
        ) : (
          <form onSubmit={submitEdit} className="space-y-2">
            <input
              type="number"
              name="rating"
              value={editForm.rating}
              onChange={handleEditChange}
              min="1"
              max="5"
              className="w-full rounded-md border px-2 py-1"
              placeholder="Rating (1-5)"
            />
            <textarea
              name="content"
              value={editForm.content}
              onChange={handleEditChange}
              className="w-full rounded-md border px-2 py-1"
              placeholder="Edit your review..."
            />
            {!review.couple_id && (
              <input
                type="email"
                name="reviewerEmail"
                value={editForm.reviewerEmail}
                onChange={handleEditChange}
                className="w-full rounded-md border px-2 py-1"
                placeholder="Enter your email"
              />
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm">Save</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Delete
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  };

  const steps = [
    { title: 'Your Information', fields: ['partner1Name', 'partner2Name'] },
    { title: 'Contact Information', fields: ['email', 'phone', 'preferredContactMethod'] },
    { title: 'Wedding Date', fields: ['weddingDate'] },
    { title: 'Guest Count', fields: ['guestCount'] },
    { title: 'Venue Location', fields: ['venueLocation'] },
    { title: 'Budget', fields: ['budget'] },
    { title: 'Service Package', fields: ['servicePackage'] },
    { title: 'Planning Timeframe', fields: ['timeframe'] },
    { title: 'Message', fields: ['message'] },
  ];

  const renderStep = () => {
    const step = steps[currentStep];
    switch (step.title) {
      case 'Your Information':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Partner 1 Name *</label>
              <input
                type="text"
                name="partner1Name"
                value={inquiryForm.partner1Name}
                onChange={handleInquiryChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Partner 2 Name *</label>
              <input
                type="text"
                name="partner2Name"
                value={inquiryForm.partner2Name}
                onChange={handleInquiryChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                required
              />
            </div>
          </div>
        );
      case 'Contact Information':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                name="email"
                value={inquiryForm.email}
                onChange={handleInquiryChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                name="phone"
                value={inquiryForm.phone}
                onChange={handleInquiryChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Preferred Contact Method</label>
              <select
                name="preferredContactMethod"
                value={inquiryForm.preferredContactMethod}
                onChange={handleInquiryChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </div>
          </div>
        );
      case 'Wedding Date':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Wedding Date</label>
            <input
              type="date"
              name="weddingDate"
              value={inquiryForm.weddingDate}
              onChange={handleInquiryChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
            />
          </div>
        );
      case 'Guest Count':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Estimated Guest Count</label>
            <input
              type="number"
              name="guestCount"
              value={inquiryForm.guestCount}
              onChange={handleInquiryChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
              min="1"
            />
          </div>
        );
      case 'Venue Location':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Venue Location</label>
            <input
              type="text"
              name="venueLocation"
              value={inquiryForm.venueLocation}
              onChange={handleInquiryChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
            />
          </div>
        );
      case 'Budget':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Budget Range</label>
            <select
              name="budget"
              value={inquiryForm.budget}
              onChange={handleInquiryChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
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
        );
      case 'Service Package':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Service Package *</label>
            <select
              name="servicePackage"
              value={inquiryForm.servicePackage}
              onChange={handleInquiryChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
              required
            >
              <option value="">Select a package</option>
              {packages.map(pkg => (
                <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
              ))}
              <option value="Custom Package">Custom Package</option>
            </select>
          </div>
        );
      case 'Planning Timeframe':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Planning Timeframe *</label>
            <select
              name="timeframe"
              value={inquiryForm.timeframe}
              onChange={handleInquiryChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
              required
            >
              <option value="">Select planning timeframe</option>
              <option value="Immediate">Immediate (within 1 month)</option>
              <option value="Soon">Soon (1-3 months)</option>
              <option value="Planning Ahead">Planning Ahead (3-6 months)</option>
              <option value="Early Planning">Early Planning (6+ months)</option>
            </select>
          </div>
        );
      case 'Message':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Message *</label>
            <textarea
              name="message"
              value={inquiryForm.message}
              onChange={handleInquiryChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
              rows={4}
              required
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-12 h-12 animate-spin text-primary" /> Loading...
    </div>
  );

  if (!vendor) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p>{error || 'Vendor not found'}</p>
      <Button onClick={() => navigate('/vendors')}>Browse Vendors</Button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="relative h-64 md:h-96 rounded-lg overflow-hidden mb-8">
        <img 
          src={vendor.images[vendor.primary_image] || vendor.images[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80'} 
          alt={`${vendor.business_name} cover`}
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-8 text-white">
          <div className="flex justify-end gap-2">
            {userRole === 'couple' && (
              <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white" onClick={handleSave} disabled={savingFavorite}>
                <Heart className={`w-4 h-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Saved' : 'Save'}
              </Button>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">{vendor.business_name}</h1>
            <div className="flex flex-wrap items-center gap-3 md:gap-6 text-sm md:text-base">
              <div className="flex items-center"><Star className="w-5 h-5 text-yellow-400 fill-current" /><span className="ml-1">{vendor.rating.toFixed(1)}</span><span className="ml-1">({reviews.length} reviews)</span></div>
              <div className="flex items-center"><MapPin className="w-5 h-5" /><span className="ml-1">{vendor.location}</span></div>
              <div className="flex items-center"><DollarSign className="w-5 h-5" /><span className="ml-1">{vendor.price_range}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-8 flex flex-wrap gap-6 items-center justify-between">
        <div className="flex items-center gap-4">
          {vendor.website_url && <a href={vendor.website_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary" title="Website"><Globe className="w-5 h-5" /></a>}
          {vendor.facebook_url && <a href={vendor.facebook_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary" title="Facebook"><Facebook className="w-5 h-5" /></a>}
          {vendor.instagram_url && <a href={vendor.instagram_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary" title="Instagram"><Instagram className="w-5 h-5" /></a>}
          {vendor.youtube_url && <a href={vendor.youtube_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary" title="YouTube"><Youtube className="w-5 h-5" /></a>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <section className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-4">About</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{vendor.description}</p>
          </section>

          {packages.length > 0 && (
            <section className="bg-white rounded-lg shadow-sm p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-semibold mb-4">Service Packages</h2>
              <div className="grid gap-4">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{pkg.name}</h3>
                        {pkg.description && <p className="text-gray-600 mb-4">{pkg.description}</p>}
                        {pkg.features?.length > 0 && (
                          <ul className="list-disc list-inside text-gray-600 space-y-1">
                            {pkg.features.map((feature: string, index: number) => (
                              <li key={index}>{feature}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${pkg.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {vendor.images.length > 0 && (
            <section className="bg-white rounded-lg shadow-sm p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-semibold mb-4">Image Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vendor.images.map((image: string, index: number) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={`${image}?auto=format&fit=crop&w=400&q=75`} 
                      alt={`${vendor.business_name} gallery ${index + 1}`} 
                      className="w-full h-full object-cover" 
                      loading="lazy" 
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {vendor.videos.length > 0 && (
            <section className="bg-white rounded-lg shadow-sm p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-semibold mb-4">Video Gallery</h2>
              <div className="space-y-6">
                {vendor.videos.map((video: { url: string; thumbnailTime: number }, index: number) => (
                  <div key={index} className="rounded-lg overflow-hidden bg-gray-100">
                    <video
                      src={video.url}
                      controls
                      className="w-full h-auto aspect-video"
                      onLoadedMetadata={(e) => {
                        const vid = e.target as HTMLVideoElement;
                        vid.currentTime = video.thumbnailTime || 0;
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section ref={reviewsRef} className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl md:text-2xl font-semibold">Reviews</h2>
            </div>
            {reviews.length === 0 ? (
              <p className="text-gray-600">No reviews yet</p>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b last:border-b-0 pb-6 last:pb-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-5 h-5 ${i < review.rating ? 'fill-current' : 'stroke-current fill-none'}`} />
                        ))}
                      </div>
                      <span className="text-gray-600">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="font-medium mb-2">
                      {review.couple_id && review.couple && review.couple.length > 0 
                        ? `${review.couple[0].partner1_name} & ${review.couple[0].partner2_name}` 
                        : review.reviewer_name || 'Anonymous'}
                    </p>
                    <p className="text-gray-600">{review.content}</p>
                    {review.response && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium mb-2">Response from {vendor.business_name}</p>
                        <p className="text-gray-600">{review.response}</p>
                        <p className="text-sm text-gray-500 mt-2">Responded on {new Date(review.response_date!).toLocaleDateString()}</p>
                      </div>
                    )}
                    <ReviewActions review={review} />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Leave a Review</h3>
              <form onSubmit={submitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Star
                        key={rating}
                        className={`w-8 h-8 cursor-pointer ${rating <= reviewForm.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        onClick={() => setRating(rating)}
                      />
                    ))}
                  </div>
                </div>
                {!user && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your Name (optional)</label>
                      <input
                        type="text"
                        name="reviewerName"
                        value={reviewForm.reviewerName}
                        onChange={handleReviewChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your Email (required for anonymous reviews)</label>
                      <input
                        type="email"
                        name="reviewerEmail"
                        value={reviewForm.reviewerEmail}
                        onChange={handleReviewChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                        placeholder="Enter your email"
                        required={!user}
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                  <textarea
                    name="content"
                    value={reviewForm.content}
                    onChange={handleReviewChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                    rows={4}
                    placeholder="Share your experience..."
                    required
                  />
                </div>
                <Button type="submit" disabled={submittingReview}>
                  {submittingReview ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Submit Review
                </Button>
              </form>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="text-xl font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between"><span className="text-gray-600">Rating</span><div className="flex items-center"><Star className="w-5 h-5 text-yellow-400 fill-current mr-1" /><span>{vendor.rating.toFixed(1)}</span></div></div>
              <div className="flex items-center justify-between"><span className="text-gray-600">Reviews</span><span>{reviews.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-600">Packages</span><span>{packages.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-600">Videos</span><span>{vendor.videos.length}</span></div>
            </div>
            <div className="space-y-3">
              <Button className="w-full" onClick={handleInquiryClick}>
                <MessageSquare className="w-4 h-4 mr-2" />
                {userRole === 'couple' ? 'Inquire Now' : 'Sign in to Inquire'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showInquiryModal && userRole === 'couple' && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {currentStep < steps.length - 1 ? steps[currentStep].title : 'Review and Send'}
              </h3>
              <span className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</span>
            </div>
            {renderStep()}
            <div className="flex justify-between mt-6">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevStep}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              )}
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNextStep} className="ml-auto">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={submitInquiry} disabled={submittingInquiry} className="ml-auto">
                  {submittingInquiry ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Inquiry
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowInquiryModal(false)}
              className="mt-4 w-full text-gray-500 hover:text-gray-700"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorProfile;