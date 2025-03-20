import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Star, Users2, DollarSign, 
  MapPin, ArrowRight, Sparkles, BellRing as Ring,
  Gift, Trophy, Instagram
} from 'lucide-react';
import { Button } from '../components/ui/button';

const VendorLanding = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/get-started', { state: { role: 'vendor' } });
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:py-12 sm:px-6">
      {/* Hero Section */}
      <div className="text-center mb-12 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          Boost Your Wedding Business with Bmatchd
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8">
          Sign up free, connect with thousands of couples, and grow your bookings starting at just $29/month!
        </p>
        <Button size="lg" onClick={handleGetStarted} className="min-w-[200px] text-base sm:text-lg">
          Get Started Now
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
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
          <div key={index} className="bg-white p-6 sm:p-8 rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 sm:mb-6">
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
            Win $500 & a FREE Year of Elite Vendor Membership!
            <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />
          </h2>
          <p className="text-base sm:text-xl mb-6 max-w-3xl mx-auto">
            🎉 Want to grow your wedding business, increase visibility, and win big? Every month, we’re giving away $500 in cash + 3 premium vendor memberships valued at over $1,800!
          </p>

          {/* Prizes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {[
              { icon: <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />, title: "$500 Visa Gift Card", description: "1 Winner/Month" },
              { icon: <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />, title: "Elite Membership", description: "1 Winner/Month ($990 Value)" },
              { icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />, title: "Featured Membership", description: "1 Winner/Month ($590 Value)" },
              { icon: <Star className="w-5 h-5 sm:w-6 sm:h-6" />, title: "Essentials Membership", description: "1 Winner/Month ($290 Value)" }
            ].map((prize, index) => (
              <div key={index} className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  {prize.icon}
                </div>
                <h3 className="font-semibold text-sm sm:text-base">{prize.title}</h3>
                <p className="text-xs sm:text-sm">{prize.description}</p>
              </div>
            ))}
          </div>

          {/* How to Enter */}
          <h3 className="text-xl sm:text-2xl font-semibold mb-4">📢 How to Enter</h3>
          <ul className="text-left max-w-md mx-auto mb-6 sm:mb-8 space-y-2 text-sm sm:text-base">
            <li className="flex items-start">
              <span className="mr-2">✅</span> Have a Vendor Listing (Starting at $29/month) <span className="font-semibold">+1 Entry</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🆓</span> Sign Up for a Free Vendor Profile <span className="font-semibold">+0.5 Entry</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">📢</span> Post Your BMatchD Badge & Tag <span className="font-semibold">@bmatchd</span> on Instagram <span className="font-semibold">+5 Entries</span>
            </li>
          </ul>
          <p className="text-xs sm:text-sm italic mb-4 sm:mb-6">More posts = more entries = better chances to win! 🚀</p>

          {/* CTA with Badge */}
          <div className="mb-6 sm:mb-8">
            <p className="text-base sm:text-lg mb-4">
              🎖️ <span className="font-semibold">Show off your Featured Vendor Badge!</span> 🎖️
            </p>
            <img
              src="https://rtzrhxxdqmnpydskixso.supabase.co/storage/v1/object/public/public_1//Featured_Logo.png"
              alt="Featured Vendor Badge"
              className="mx-auto w-24 h-24 sm:w-32 sm:h-32 mb-4"
            />
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-white text-teal-700 hover:bg-gray-100 min-w-[200px] text-base sm:text-lg"
            >
              Get Listed & Start Earning Entries
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Fine Print */}
          <details className="text-xs sm:text-sm text-white/80 max-w-3xl mx-auto">
            <summary className="cursor-pointer mb-2">View Contest Fine Print</summary>
            <p>
              No purchase necessary to enter or win. A purchase does not increase your chances of winning. Open to legal residents of all 50 states and the District of Columbia who are 18 years or older. Void where prohibited. Entries must be received between the first of each month and the 27th of each month. Winners will be selected randomly on the 28th of each month and notified via email and/or social media. Each vendor listing ($29/month or higher) = 1 entry. Free vendor profile = 0.5 entries. Each social media badge post tagging @bmatchd = 5 additional entries per month. Prizes: One (1) winner will receive a $500 Visa Gift Card. Additional winners will receive one of the following: One (1) Elite Membership ($990 value), One (1) Featured Membership ($590 value), or One (1) Essentials Membership ($290 value). Prizes are non-transferable and cannot be exchanged for cash. Winners must respond within 5 days of notification to claim their prize. Failure to respond may result in forfeiture, and a new winner may be selected. Giveaway is sponsored by BMatchD. For questions, contact info@bmatchd.com. This promotion is in no way sponsored, endorsed, or administered by, or associated with Instagram, Facebook, or any other social media platform. BMatchD reserves the right to modify, suspend, or cancel this giveaway at any time for any reason.
            </p>
          </details>
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-12 sm:mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-8">
          {[
            { icon: <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />, title: "Create Account", description: "Sign up free and build your vendor profile in minutes." },
            { icon: <Ring className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />, title: "Apply Promo", description: "Use GETLISTED for a free month or JOIN50 for 50% off a year." },
            { icon: <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />, title: "Get Discovered", description: "Showcase your services to couples in your area." },
            { icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />, title: "Book More Gigs", description: "Turn inquiries into bookings and grow your business." }
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
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Grow Your Wedding Business?</h2>
        <p className="text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto text-sm sm:text-base">
          Join the Bmatchd community—free to start, with exclusive savings using <span className="font-semibold bg-yellow-100 px-2 py-1 rounded">GETLISTED</span> or <span className="font-semibold bg-yellow-100 px-2 py-1 rounded">JOIN50</span>. Connect with thousands of couples today!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={handleGetStarted} className="min-w-[200px] text-base sm:text-lg">
            Get Started Now
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

export default VendorLanding;