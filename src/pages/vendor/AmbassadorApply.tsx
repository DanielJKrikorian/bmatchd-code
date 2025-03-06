import React, { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface FormData {
  name: string;
  email: string;
  phone: string;
  program: 'connector' | 'influencer' | 'promoter';
  instagram: string;
  facebook: string;
  tiktok: string;
  message: string;
}

const AmbassadorApply = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    program: 'connector',
    instagram: '',
    facebook: '',
    tiktok: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch('/.netlify/functions/send-contact-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: `Ambassador Program Application - ${formData.program.charAt(0).toUpperCase() + formData.program.slice(1)}`,
          message: `
New Ambassador Program Application

Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}
Program: ${formData.program}

Social Media:
Instagram: ${formData.instagram}
Facebook: ${formData.facebook}
TikTok: ${formData.tiktok}

Message:
${formData.message}
          `.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send application');
      }

      toast.success('Application submitted successfully! We will contact you soon.');
      navigate('/vendor/ambassador');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Button
        variant="ghost"
        onClick={() => navigate('/vendor/ambassador')}
        className="mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Ambassador Program
      </Button>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h1 className="text-2xl font-semibold">Apply to Ambassador Program</h1>
          <p className="text-gray-600">Join our community of wedding industry leaders</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Program Level
                </label>
                <select
                  required
                  value={formData.program}
                  onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value as FormData['program'] }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="connector">Level 1: Connector</option>
                  <option value="influencer">Level 2: Influencer</option>
                  <option value="promoter">Level 3: Power Promoter</option>
                </select>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Social Media Links</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Instagram Profile URL
                </label>
                <input
                  type="url"
                  value={formData.instagram}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="https://instagram.com/yourusername"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Facebook Profile URL
                </label>
                <input
                  type="url"
                  value={formData.facebook}
                  onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="https://facebook.com/yourusername"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  TikTok Profile URL
                </label>
                <input
                  type="url"
                  value={formData.tiktok}
                  onChange={(e) => setFormData(prev => ({ ...prev, tiktok: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="https://tiktok.com/@yourusername"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Why do you want to join the Ambassador Program?
            </label>
            <textarea
              required
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Tell us about your experience and why you'd be a great ambassador..."
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/vendor/ambassador')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AmbassadorApply;