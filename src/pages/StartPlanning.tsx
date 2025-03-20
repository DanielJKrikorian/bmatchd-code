import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Star, Calendar, BellRing as Ring, MapPin, 
  DollarSign, ArrowRight, Users2, Sparkles, Gift, Trophy
} from 'lucide-react';
import { Button } from '../components/ui/button';

const StartPlanning = () => {
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    navigate('/get-started', { state: { role: 'couple' } });
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:py-12 sm:px-6">
      {/* Hero Section */}
      <div className="text-center mb-12 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Plan Your Perfect Wedding</h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8">
          Everything you need to plan your dream wedding, all in one place.
        </p>
        <Button size="lg" onClick={handleCreateAccount} className="min-w-[200px] text-base sm:text-lg">
          Create Free Account
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
        {[
          {
            icon: <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />,
            title: "Find Perfect Vendors",
            description: "Browse and connect with the best wedding vendors in your area. Read reviews, compare prices, and find the perfect match for your style and budget."
          },
          {
            icon: <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />,
            title: "Stay Organized",
            description: "Keep track of appointments, deadlines, and to-dos. Our planning tools help you stay on top of everything from vendor meetings to final payments."
          },
          {
            icon: <Star className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />,
            title: "Make Better Decisions",
            description: "Get recommendations based on your style, budget, and location. Read real reviews from other couples to make informed decisions."
          }
        ].map((feature, index) => (
          <div key={index} className="bg-white p-6 sm:p-8 rounded-lg shadow-sm">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              {feature.icon}
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{feature.title}</h3>
            <p className="text-gray-600 text-sm sm:text-base">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Contest Section */}
      <section className="bg-gradient-to-r from-teal-500 to-teal-700 text-white rounded-2xl p-8 sm:p-12 mb-12 sm:mb-16">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 flex flex-wrap items-center justify-center gap-2">
            <Gift className="w-7 h-7 sm:w-8 sm:h-8" />
            Earn Entries & Win a $250 Gift Card!
            <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />
          </h2>
          <p className="text-base sm:text-xl mb-6 max-w-3xl mx-auto">
            💍 Want to make wedding planning fun and rewarding? Every action you take on BMatchD earns you entries to win a $250 Mastercard gift card!
          </p>

          {/* How to Earn Entries */}
          <h3 className="text-xl sm:text-2xl font-semibold mb-4">🎟️ How to Earn Entries</h3>
          <ul className="text-left max-w-md mx-auto mb-6 sm:mb-8 space-y-2 text-sm sm:text-base">
            <li className="flex items-start">
              <span className="mr-2">✅</span> Sign Up on BMatchD <span className="font-semibold">+1 Entry</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">💬</span> Send an Inquiry to a Vendor <span className="font-semibold">+1 Entry Each</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">📅</span> Book a Vendor Through BMatchD <span className="font-semibold">+5 Entries</span>
            </li>
          </ul>
          <p className="text-xs sm:text-sm italic mb-4 sm:mb-6">
            The more you engage, the better your chances to win! 🎊
          </p>

          {/* CTA */}
          <div className="mb-6 sm:mb-8">
            <p className="text-base sm:text-lg mb-4">
              🚀 First Drawing at the End of This Month! 🚀
            </p>
            <p className="text-sm sm:text-base mb-4">
              Start earning entries now—don’t miss your chance to <span className="font-semibold">win $250 just for planning your wedding!</span>
            </p>
            <Button
              size="lg"
              onClick={handleCreateAccount}
              className="bg-white text-teal-700 hover:bg-gray-100 min-w-[200px] text-base sm:text-lg"
            >
              Start Planning & Earn Entries Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Fine Print */}
          <details className="text-xs sm:text-sm text-white/80 max-w-3xl mx-auto">
            <summary className="cursor-pointer mb-2">View Contest Fine Print</summary>
            <p>
              No purchase necessary to enter or win. A purchase does not increase your chances of winning. Open to legal residents of all 50 states and the District of Columbia who are 18 years or older. Void where prohibited. Entries must be received between the 1st and 27th of each month. Winners will be selected randomly on the 28th of each month and notified via email and/or social media. To enter, sign up as a couple on BMatchD for 1 entry, and each vendor inquiry made on BMatchD earns 1 additional entry. One (1) winner will receive a $250 Mastercard Gift Card. Winners must respond within 5 days of notification to claim their prize. Failure to respond within this timeframe may result in forfeiture, and a new winner may be selected. Prizes are non-transferable and cannot be exchanged for cash. This promotion is not sponsored, endorsed, or administered by, or associated with, Instagram, Facebook, or any other social media platform. BMatchD reserves the right to modify, suspend, or cancel this giveaway at any time for any reason. For questions, contact info@bmatchd.com.
            </p>
          </details>
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-12 sm:mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-8">
          {[
            { icon: <Users2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />, title: "Create Account", description: "Sign up for free and tell us about your wedding vision." },
            { icon: <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />, title: "Find Vendors", description: "Browse and connect with top wedding vendors in your area." },
            { icon: <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />, title: "Schedule Meetings", description: "Book appointments and manage your vendor communications." },
            { icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />, title: "Plan Your Day", description: "Use our tools to bring your dream wedding to life." }
          ].map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                {step.icon}
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">{step.title}</h3>
              <p className="text-gray-600 text-sm sm:text-base">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 rounded-2xl p-8 sm:p-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Start Planning?</h2>
        <p className="text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto text-sm sm:text-base">
          Join thousands of couples who have found their perfect wedding vendors through our platform. Create your free account today and start planning your dream wedding.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={handleCreateAccount} className="min-w-[200px] text-base sm:text-lg">
            Create Free Account
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/vendors')} className="min-w-[200px] text-base sm:text-lg">
            Browse Vendors
          </Button>
        </div>
      </section>
    </div>
  );
};

export default StartPlanning;