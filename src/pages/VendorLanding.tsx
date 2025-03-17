import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Star, Users2, DollarSign, 
  MapPin, ArrowRight, Sparkles, BellRing as Ring 
} from 'lucide-react';
import { Button } from '../components/ui/button';

const VendorLanding = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Navigate to get-started with vendor role
    navigate('/get-started', { state: { role: 'vendor' } });
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Boost Your Wedding Business with Bmatchd</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Sign up free, connect with thousands of couples, and grow your bookings starting at just $29/month!
        </p>
        <Button size="lg" onClick={handleGetStarted} className="min-w-[200px]">
          Get Started Now
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {[
          {
            icon: <DollarSign className="w-6 h-6 text-primary" />,
            title: "Free to Sign Up",
            description: "Get started at no cost and work with your couples. Use promocode GETLISTED for a free month."
          },
          {
            icon: <Users2 className="w-6 h-6 text-primary" />,
            title: "Reach Thousands",
            description: "Get in front of thousands of engaged couples in your area seeking vendors like you."
          },
          {
            icon: <Star className="w-6 h-6 text-primary" />,
            title: "Low-Cost Plans",
            description: "Starting at $29/month—or use JOIN50 for 50% off your first year."
          }
        ].map((feature, index) => (
          <div key={index} className="bg-white p-8 rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { icon: <Heart className="w-6 h-6 text-primary" />, title: "Create Account", description: "Sign up free and build your vendor profile in minutes." },
            { icon: <Ring className="w-6 h-6 text-primary" />, title: "Apply Promo", description: "Use GETLISTED for a free month or JOIN50 for 50% off a year." },
            { icon: <MapPin className="w-6 h-6 text-primary" />, title: "Get Discovered", description: "Showcase your services to couples in your area." },
            { icon: <Sparkles className="w-6 h-6 text-primary" />, title: "Book More Gigs", description: "Turn inquiries into bookings and grow your business." }
          ].map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                {step.icon}
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 rounded-2xl p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Grow Your Wedding Business?</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Join the Bmatchd community—free to start, with exclusive savings using <span className="font-semibold bg-yellow-100 px-2 py-1 rounded">GETLISTED</span> or <span className="font-semibold bg-yellow-100 px-2 py-1 rounded">JOIN50</span>. Connect with thousands of couples today!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={handleGetStarted} className="min-w-[200px]">
            Get Started Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/vendors')} className="min-w-[200px]">
            Browse Vendors
          </Button>
        </div>
      </section>
    </div>
  );
};

export default VendorLanding;