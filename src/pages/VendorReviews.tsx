import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Calendar, Link, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button.tsx';
import { supabase } from '../lib/supabase.ts';
import { toast } from 'react-hot-toast';
import BackToDashboard from '../components/BackToDashboard.tsx';

// Define RawReview type for Supabase response
interface RawReview {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  response?: string | null;
  response_date?: string | null;
  couple: Array<{ partner1_name: string; partner2_name: string }> | null;
  couple_id?: string;
  reviewer_name?: string;
  reviewer_email?: string;
}

interface Review {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  response?: string | null;
  response_date?: string | null;
  couple: {
    partner1_name: string;
    partner2_name: string;
  } | null;
  couple_id?: string;
  reviewer_name?: string;
  reviewer_email?: string;
}

const VendorReviews = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [responding, setResponding] = useState<string | null>(null);
  const [response, setResponse] = useState('');

  const loadReviews = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/vendor/signin');
        return;
      }

      // Get vendor ID
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (vendorError) {
        console.error('Error fetching vendor:', vendorError);
        toast.error('Failed to load vendor profile');
        return;
      }

      if (!vendorData) {
        toast.error('Vendor profile not found');
        return;
      }

      // Get reviews with couple details and new fields
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          content,
          response,
          response_date,
          created_at,
          couple:couples!couple_id (
            partner1_name,
            partner2_name
          ),
          couple_id,
          reviewer_name,
          reviewer_email
        `)
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        toast.error('Failed to load reviews');
        return;
      }

      // Log raw reviewsData to debug
      console.log('Raw reviewsData:', reviewsData);

      // Transform raw reviews to match Review interface and fetch couple data if needed
      const transformedReviews = await Promise.all(
        reviewsData.map(async (review: RawReview) => {
          let coupleData = review.couple && review.couple.length > 0 ? review.couple[0] : null;

          // If couple is null but couple_id exists, fetch the couple data
          if (!coupleData && review.couple_id) {
            const { data: couple, error: coupleError } = await supabase
              .from('couples')
              .select('partner1_name, partner2_name')
              .eq('id', review.couple_id)
              .single();

            if (coupleError) {
              console.error('Error fetching couple data:', coupleError);
            } else {
              coupleData = couple;
            }
          }

          return {
            ...review,
            couple: coupleData,
          } as Review;
        })
      );

      // Log transformed reviews to debug
      console.log('Transformed reviews:', transformedReviews);

      // Calculate and update vendor rating
      const totalRating = transformedReviews.reduce((sum: number, review: Review) => sum + review.rating, 0);
      const averageRating = transformedReviews.length > 0 ? totalRating / transformedReviews.length : 0;

      // Update vendor rating
      const { error: updateError } = await supabase
        .from('vendors')
        .update({ rating: averageRating })
        .eq('id', vendorData.id);

      if (updateError) {
        console.error('Error updating vendor rating:', updateError);
      }

      setReviews(transformedReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmitResponse = async (reviewId: string) => {
    if (!response.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          response: response.trim(),
          response_date: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(prev =>
        prev.map(review =>
          review.id === reviewId
            ? {
                ...review,
                response: response.trim(),
                response_date: new Date().toISOString()
              }
            : review
        )
      );

      setResponding(null);
      setResponse('');
      toast.success('Response posted successfully');
    } catch (error) {
      console.error('Error posting response:', error);
      toast.error('Failed to post response');
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <BackToDashboard />
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Reviews & Ratings</h1>
            <p className="text-gray-600">Manage and respond to your customer reviews</p>
          </div>
          <Button onClick={() => navigate('/vendor/reviews/links')}>
            <Link className="w-4 h-4 mr-2" />
            Get Reviews
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          {
            label: 'Average Rating',
            value: getAverageRating(),
            icon: <Star className="w-6 h-6 text-yellow-400" />
          },
          {
            label: 'Total Reviews',
            value: reviews.length,
            icon: <MessageSquare className="w-6 h-6 text-primary" />
          },
          {
            label: 'Response Rate',
            value: `${Math.round((reviews.filter(r => r.response).length / reviews.length) * 100) || 0}%`,
            icon: <Calendar className="w-6 h-6 text-green-500" />
          }
        ].map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center space-x-4">
              {stat.icon}
              <div>
                <p className="text-gray-600">{stat.label}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No reviews yet</h2>
            <p className="text-gray-600">
              When couples or other customers review your services, they'll appear here.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-4">
                {/* Review Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < review.rating ? 'fill-current' : 'stroke-current fill-none'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-gray-600">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-medium mt-1">
                      {(() => {
                        console.log('Rendering review:', review);
                        return review.couple?.partner1_name && review.couple?.partner2_name
                          ? `${review.couple.partner1_name} & ${review.couple.partner2_name}`
                          : review.reviewer_name?.trim()
                          ? `${review.reviewer_name} (${review.reviewer_email || 'No email'})`
                          : 'Anonymous Reviewer';
                      })()}
                    </p>
                  </div>
                </div>

                {/* Review Content */}
                <p className="text-gray-600">{review.content}</p>

                {/* Vendor Response */}
                {review.response ? (
                  <div className="bg-gray-50 p-4 rounded-lg mt-4">
                    <p className="font-medium mb-2">Your Response</p>
                    <p className="text-gray-600">{review.response}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Responded on {new Date(review.response_date!).toLocaleDateString()}
                    </p>
                  </div>
                ) : responding === review.id ? (
                  <div className="mt-4">
                    <textarea
                      value={response}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponse(e.target.value)}
                      placeholder="Write your response..."
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      rows={4}
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setResponding(null);
                          setResponse('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={() => handleSubmitResponse(review.id)}>
                        Post Response
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setResponding(review.id)}
                  >
                    Respond to Review
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VendorReviews;