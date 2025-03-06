import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Calendar, MessageSquare, Star, Clock, Heart, 
  DollarSign, Users2, Lightbulb, Store, ArrowRight, 
  Camera, Music, Cake, MapPin, Shield 
} from 'lucide-react';
import { Button } from '../components/ui/button';

const Home = () => {
  const navigate = useNavigate();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const handleListBusiness = () => {
    console.log('List Your Business clicked → Navigating to /get-started with vendor role');
    navigate('/get-started', { state: { role: 'vendor' } });
  };

  return (
    <div className="space-y-24">
      <section className="relative">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=2000&q=80"
            alt="Wedding celebration"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-32 md:py-48 relative">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Your Perfect Wedding Journey Starts Here
            </h1>
            <p className="text-xl text-gray-100 mb-8">
              Connect with trusted wedding professionals and plan your dream wedding with confidence
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="text-lg px-8 bg-white text-primary hover:bg-gray-100"
                onClick={() => navigate('/start-planning')}
              >
                Start Planning
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="text-lg px-8 border-white text-white hover:bg-white/10"
                onClick={handleListBusiness} // Updated handler
              >
                List Your Business
                <Store className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Explore Wedding Services</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[
            { icon: <Store className="w-6 h-6" />, title: "Venues", image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80" },
            { icon: <Camera className="w-6 h-6" />, title: "Photography", image: "https://images.unsplash.com/photo-1514849302-984523450cf4?auto=format&fit=crop&w=800&q=80" },
            { icon: <Cake className="w-6 h-6" />, title: "Catering", image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80" },
            { icon: <Music className="w-6 h-6" />, title: "Entertainment", image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80" },
          ].map((category) => (
            <div
              key={category.title}
              className="relative group cursor-pointer"
              onMouseEnter={() => setHoveredCategory(category.title)}
              onMouseLeave={() => setHoveredCategory(null)}
              onClick={() => navigate(`/vendors?category=${category.title}`)}
            >
              <div className="aspect-square rounded-xl overflow-hidden">
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0 transition-opacity duration-300" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                  <div className={`p-3 rounded-full bg-white/10 backdrop-blur-sm mb-3 transition-transform duration-300 ${
                    hoveredCategory === category.title ? 'scale-110' : ''
                  }`}>
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-center">{category.title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/vendors')}
            className="text-lg"
          >
            View All Categories
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose BMATCHD</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { icon: <Search className="w-8 h-8 text-primary" />, title: "Easy Search", description: "Smart matching technology helps you find vendors that perfectly align with your style, budget, and vision." },
            { icon: <Calendar className="w-8 h-8 text-primary" />, title: "Smart Booking", description: "Streamlined scheduling system for consultations and seamless booking management." },
            { icon: <MessageSquare className="w-8 h-8 text-primary" />, title: "Direct Communication", description: "Real-time messaging platform to connect with vendors and discuss your vision directly." },
          ].map((feature) => (
            <div key={feature.title} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;