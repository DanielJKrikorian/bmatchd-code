import React, { useState } from 'react';
import { Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase'; // Ensure this exists

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    category: 'For Couples',
    question: 'How do I find the right vendors for my wedding?',
    answer: 'You can use our search feature to filter vendors by category, location, and price range. Read reviews from other couples, view vendor portfolios, and contact them directly through our platform to discuss your needs.'
  },
  {
    category: 'For Couples',
    question: 'Is it free to create a couple account?',
    answer: 'Yes! Creating a couple account is completely free. You can browse vendors, save your favorites, and manage your wedding planning all in one place.'
  },
  {
    category: 'For Couples',
    question: 'How do I contact vendors?',
    answer: 'Once you create an account, you can message vendors directly through our platform. Simply visit a vendor\'s profile and click the "Message Vendor" button to start a conversation.'
  },
  {
    category: 'For Vendors',
    question: 'How do I list my business on WeddingHub?',
    answer: 'Start by creating a vendor account and choosing a subscription plan. You can then create your profile, add photos, and start receiving inquiries from couples.'
  },
  {
    category: 'For Vendors',
    question: 'What are the subscription plans?',
    answer: 'We offer three subscription tiers: Essential, Featured, and Elite. Each plan offers different levels of visibility and features to help you grow your business.'
  },
  {
    category: 'For Vendors',
    question: 'How do I manage my bookings?',
    answer: 'Use your vendor dashboard to manage all your bookings, respond to inquiries, and track your calendar. You\'ll receive notifications for new booking requests and messages.'
  },
  {
    category: 'Payments & Security',
    question: 'Is my payment information secure?',
    answer: 'Yes, we use Stripe for all payment processing, ensuring your payment information is secure and encrypted. We never store your credit card details.'
  },
  {
    category: 'Payments & Security',
    question: 'What happens if I need to cancel my subscription?',
    answer: 'You can cancel your subscription at any time from your account settings. Your benefits will continue until the end of your current billing period.'
  },
  {
    category: 'General',
    question: 'How do I update my account information?',
    answer: 'You can update your account information, including contact details and preferences, through your account settings page.'
  },
  {
    category: 'General',
    question: 'Is my personal information protected?',
    answer: 'Yes, we take data privacy seriously. We use industry-standard security measures to protect your information and never share your personal details without your consent.'
  }
];

const HelpCenter = () => {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      console.log('HelpCenter: Submitting form data to Supabase:', formData);
      const { error } = await supabase
        .from('contact_submissions')
        .insert([formData]);

      if (error) {
        throw new Error(error.message || 'Failed to submit contact form');
      }

      // Removed Zapier webhook client-side to avoid CORS
      // Zapier will trigger on new Supabase row via its own integration

      toast.success('Message submitted successfully! We\'ll get back to you soon.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const categories = Array.from(new Set(FAQ_ITEMS.map(item => item.category)));

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Help Center</h1>
        <p className="text-xl text-gray-600">
          Find answers to common questions or contact our support team
        </p>
      </div>

      {/* FAQ Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-8">Frequently Asked Questions</h2>
        
        {categories.map(category => (
          <div key={category} className="mb-8">
            <h3 className="text-lg font-medium text-primary mb-4">{category}</h3>
            <div className="space-y-4">
              {FAQ_ITEMS.filter(item => item.category === category).map((item) => (
                <div
                  key={item.question}
                  className="bg-white rounded-lg shadow-sm"
                >
                  <button
                    onClick={() => setExpandedQuestion(
                      expandedQuestion === item.question ? null : item.question
                    )}
                    className="w-full text-left px-6 py-4 flex justify-between items-center"
                  >
                    <span className="font-medium">{item.question}</span>
                    {expandedQuestion === item.question ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {expandedQuestion === item.question && (
                    <div className="px-6 py-4 border-t">
                      <p className="text-gray-600">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Contact Section */}
      <section className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Mail className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-semibold">Contact Us</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              required
              value={formData.subject}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              value={formData.message}
              onChange={handleChange}
              rows={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <Button type="submit" className="w-full md:w-auto" disabled={sending}>
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </form>

        <div className="mt-8 pt-8 border-t">
          <p className="text-gray-600">
            You can also reach us directly at{' '}
            <a 
              href="mailto:info@bmatchd.com" 
              className="text-primary hover:underline"
            >
              info@bmatchd.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default HelpCenter;