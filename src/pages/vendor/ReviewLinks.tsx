import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Copy, Check, Mail, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import BackToDashboard from '../../components/BackToDashboard';

interface ReviewLink {
  id: string;
  couple_email: string;
  couple_name: string;
  token: string;
  status: 'pending' | 'completed';
  created_at: string;
  expires_at: string;
  completed_at: string | null;
}

const ReviewLinks = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [links, setLinks] = useState<ReviewLink[]>([]);
  const [formData, setFormData] = useState({
    coupleName: '',
    coupleEmail: ''
  });

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/vendor/signin');
        return;
      }

      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!vendorData) {
        toast.error('Vendor profile not found');
        return;
      }

      // Get review links
      const { data: linksData, error } = await supabase
        .from('review_links')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(linksData || []);
    } catch (error) {
      console.error('Error loading review links:', error);
      toast.error('Failed to load review links');
    } finally {
      setLoading(false);
    }
  };

  const generateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generating) return;
    setGenerating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!vendorData) throw new Error('Vendor profile not found');

      // Generate review link
      const { data: token, error } = await supabase.rpc(
        'generate_review_link',
        {
          p_vendor_id: vendorData.id,
          p_couple_email: formData.coupleEmail,
          p_couple_name: formData.coupleName
        }
      );

      if (error) throw error;

      toast.success('Review link generated successfully');
      setFormData({ coupleName: '', coupleEmail: '' });
      loadLinks();
    } catch (error) {
      console.error('Error generating review link:', error);
      toast.error('Failed to generate review link');
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = async (token: string) => {
    try {
      const reviewUrl = `${window.location.origin}/review/${token}`;
      await navigator.clipboard.writeText(reviewUrl);
      toast.success('Link copied to clipboard');
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  const sendEmail = async (link: ReviewLink) => {
    try {
      const reviewUrl = `${window.location.origin}/review/${link.token}`;
      const emailUrl = `mailto:${link.couple_email}?subject=Please Review Your Experience&body=Hi ${
        link.couple_name
      },%0D%0A%0D%0AWe'd love to hear about your experience! Please take a moment to leave us a review using this link:%0D%0A%0D%0A${
        encodeURIComponent(reviewUrl)
      }%0D%0A%0D%0AThank you!`;
      
      window.location.href = emailUrl;
    } catch (error) {
      console.error('Error opening email:', error);
      toast.error('Failed to open email client');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading review links...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <BackToDashboard />
      
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h1 className="text-2xl font-semibold">Review Links</h1>
          <p className="text-gray-600">Generate and manage review links for past clients</p>
        </div>

        <div className="p-6">
          {/* Generate Link Form */}
          <form onSubmit={generateLink} className="bg-gray-50 rounded-lg p-4 space-y-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Couple's Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.coupleName}
                  onChange={(e) => setFormData(prev => ({ ...prev, coupleName: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g., John & Jane"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Couple's Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.coupleEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, coupleEmail: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Link
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Links List */}
          <div className="space-y-4">
            {links.length === 0 ? (
              <div className="text-center py-12">
                <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No review links generated yet</p>
              </div>
            ) : (
              links.map((link) => (
                <div 
                  key={link.id}
                  className={`bg-white border rounded-lg p-4 ${
                    link.status === 'completed' ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{link.couple_name}</h3>
                      <p className="text-sm text-gray-600">{link.couple_email}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className="text-sm text-gray-500">
                          Created: {new Date(link.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-gray-500">
                          Expires: {new Date(link.expires_at).toLocaleDateString()}
                        </span>
                        {link.completed_at && (
                          <span className="text-sm text-green-600">
                            Completed: {new Date(link.completed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(link.token)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendEmail(link)}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Send Email
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewLinks;