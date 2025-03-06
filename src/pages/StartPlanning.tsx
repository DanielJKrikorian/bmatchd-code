import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Star, Calendar, BellRing as Ring, MapPin, 
  DollarSign, ArrowRight, Users2, Sparkles 
} from 'lucide-react';
import { Button } from '../components/ui/button';

const StartPlanning = () => {
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    navigate('/get-started', { state: { role: 'couple' } });
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Plan Your Perfect Wedding</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Everything you need to plan your dream wedding, all in one place.
        </p>
        <Button size="lg" onClick={handleCreateAccount} className="min-w-[200px]">
          Create Free Account
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {[
          {
            icon: <Heart className="w-6 h-6 text-primary" />,
            title: "Find Perfect Vendors",
            description: "Browse and connect with the best wedding vendors in your area. Read reviews, compare prices, and find the perfect match for your style and budget."
          },
          {
            icon: <Calendar className="w-6 h-6 text-primary" />,
            title: "Stay Organized",
            description: "Keep track of appointments, deadlines, and to-dos. Our planning tools help you stay on top of everything from vendor meetings to final payments."
          },
          {
            icon: <Star className="w-6 h-6 text-primary" />,
            title: "Make Better Decisions",
            description: "Get recommendations based on your style, budget, and location. Read real reviews from other couples to make informed decisions."
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
            { icon: <Users2 className="w-6 h-6 text-primary" />, title: "Create Account", description: "Sign up for free and tell us about your wedding vision." },
            { icon: <MapPin className="w-6 h-6 text-primary" />, title: "Find Vendors", description: "Browse and connect with top wedding vendors in your area." },
            { icon: <Calendar className="w-6 h-6 text-primary" />, title: "Schedule Meetings", description: "Book appointments and manage your vendor communications." },
            { icon: <Sparkles className="w-6 h-6 text-primary" />, title: "Plan Your Day", description: "Use our tools to bring your dream wedding to life." }
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
        <h2 className="text-3xl font-bold mb-4">Ready to Start Planning?</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Join thousands of couples who have found their perfect wedding vendors through our platform. Create your free account today and start planning your dream wedding.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={handleCreateAccount} className="min-w-[200px]">
            Create Free Account
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

export default StartPlanning;