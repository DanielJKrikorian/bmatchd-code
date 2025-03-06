import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface ReviewLink {
  id: string;
  vendor_id: string;
  couple_name: string;
  status: 'pending' | 'completed';
  vendor: {
    business_name: string;
    category: string;
  };
}

const Review = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewLink, setReviewLink] = useState<ReviewLink | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    rating: 5,
    content: ''
  });

  useEffect(() => {
    if (!token) {
      console.error('Missing token in URL');
      setErrorMessage('Missing review token.');
      setLoading(false);
      return;
    }
    console.log('Token found:', token);
    loadReviewLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadReviewLink = async () => {
    console.log('Loading review link with token:', token);
    try {
      const { data: linkData, error: linkError } = await supabase
        .from('review_links')
        .select(`
          id,
          vendor_id,
          couple_name,
          status,
          vendor:vendors (
            business_name,
            category
          )
        `)
        .eq('token', token)
        .single();

      if (linkError) {
        console.error('Error fetching review link:', linkError);
        setErrorMessage('Failed to load review link.');
        return;
      }

      if (!linkData) {
        console.error('No review link data found');
        setErrorMessage('Invalid or expired review link.');
        return;
      }

      if (linkData.status === 'completed') {
        console.error('Review link already completed');
        setErrorMessage('This review has already been submitted.');
        return;
      }

      console.log('Review link loaded:', linkData);
      setReviewLink(linkData);
    } catch (error) {
      console.error('Exception loading review link:', error);
      setErrorMessage('An error occurred while loading the review link.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewLink || submitting) return;
    setSubmitting(true);

    try {
      // Insert review into the "reviews" table
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          vendor_id: reviewLink.vendor_id,
          rating: formData.rating,
          content: formData.content,
          couple_name: reviewLink.couple_name
        });

      if (reviewError) {
        console.error('Error inserting review:', reviewError);
        throw reviewError;
      }

      // Update the review_links table status
      const { error: updateError } = await supabase
        .from('review_links')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', reviewLink.id);

      if (updateError) {
        console.error('Error updating review link:', updateError);
        throw updateError;
      }

      toast.success('Thank you for your review!');
      navigate('/');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-600">{errorMessage}</p>
      </div>
    );
  }

  if (!reviewLink) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Invalid review link</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h1 className="text-2xl font-semibold">Write a Review</h1>
          <p className="text-gray-600">for {reviewLink.vendor.business_name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, rating }))
                  }
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Star
                    className={`w-8 h-8 ${
                      rating <= formData.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Share your experience..."
            />
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Review;