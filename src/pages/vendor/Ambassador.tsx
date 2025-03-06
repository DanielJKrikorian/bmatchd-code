import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, Star, Trophy, Users, Gift, Video, Share2, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import BackToDashboard from '../../components/BackToDashboard';

const Ambassador = () => {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <BackToDashboard />
      
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">BMatchD Ambassador Program</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Join the Movement. Earn Rewards. Grow Your Business. 🚀
        </p>
      </div>

      {/* Levels Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* Level 1 */}
        <div className="bg-white rounded-xl shadow-sm p-8 border-2 border-transparent hover:border-primary transition-colors">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Trophy className="w-6 h-6 text-yellow-700" />
            </div>
            <h3 className="text-xl font-semibold">Level 1: Connector</h3>
          </div>
          <ul className="space-y-3 text-gray-600 mb-6">
            <li className="flex items-start">
              <Gift className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
              Get a Unique Referral Code
            </li>
            <li className="flex items-start">
              <Share2 className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
              Every 3 vendors who sign up using your code = 1 FREE month
            </li>
            <li className="flex items-start">
              <Star className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
              No limit—keep referring & earning!
            </li>
          </ul>
        </div>

        {/* Level 2 */}
        <div className="bg-white rounded-xl shadow-sm p-8 border-2 border-transparent hover:border-primary transition-colors">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-full">
              <Crown className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold">Level 2: Influencer</h3>
          </div>
          <ul className="space-y-3 text-gray-600 mb-6">
            <li className="flex items-start">
              <MessageSquare className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
              Post about BMatchD once a month on social media
            </li>
            <li className="flex items-start">
              <Users className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
              Get 3 new vendors to sign up
            </li>
            <li className="flex items-start">
              <Gift className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
              Earn 50% off a FULL YEAR of BMatchD!
            </li>
          </ul>
        </div>

        {/* Level 3 */}
        <div className="bg-white rounded-xl shadow-sm p-8 border-2 border-primary">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Level 3: Power Promoter</h3>
          </div>
          <ul className="space-y-3 text-gray-600 mb-6">
            <li className="flex items-start">
              <Video className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
              Create 3 short UGC-style videos about BMatchD
            </li>
            <li className="flex items-start">
              <Share2 className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
              Post about BMatchD 2x per month
            </li>
            <li className="flex items-start">
              <Users className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
              Get 9 new vendors to sign up
            </li>
            <li className="flex items-start">
              <Gift className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
              Get a FULL YEAR of BMatchD—FREE!
            </li>
          </ul>
        </div>
      </div>

      {/* Benefits Section */}
      <section className="bg-white rounded-lg shadow-sm p-8 mb-16">
        <h2 className="text-2xl font-semibold mb-6">Why Become an Ambassador?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-2">Grow Your Community</h3>
              <p className="text-gray-600">Build relationships with fellow vendors and expand your network</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-2">Keep 100% of Rewards</h3>
              <p className="text-gray-600">No commissions - earn full rewards for your referrals</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-2">Exclusive Benefits</h3>
              <p className="text-gray-600">Get early access to new features and special perks</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-2">Industry Leadership</h3>
              <p className="text-gray-600">Be recognized as a key player in the wedding industry</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <div className="text-center bg-primary/5 rounded-2xl p-12">
        <h2 className="text-2xl font-bold mb-4">Ready to Join?</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Start earning rewards and helping other vendors succeed. Join the BMatchD Ambassador Program today!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/vendor/ambassador/apply')}>
            Apply Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => window.location.href = 'mailto:info@bmatchd.com'}>
            <MessageSquare className="w-5 h-5 mr-2" />
            Contact Us
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Ambassador;