import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Calendar, MessageSquare, Star, Clock, Heart, 
  DollarSign, Users2, Lightbulb, Store, ArrowRight, 
  Camera, Music, Cake, MapPin, Shield 
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';

// Fisher-Yates shuffle for randomizing vendors
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Home = () => {
  const navigate = useNavigate();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [eliteVendors, setEliteVendors] = useState([]); // All elite vendors
  const [displayedVendors, setDisplayedVendors] = useState([]); // Currently displayed 3 vendors
  const [loadingVendors, setLoadingVendors] = useState(true);

  const handleListBusiness = () => {
    navigate('/get-started', { state: { role: 'vendor' } });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery || locationQuery) {
      navigate(`/vendors?search=${searchQuery}&location=${locationQuery}`);
    }
  };

  // Fetch and shuffle elite vendors from Supabase
  useEffect(() => {
    const loadEliteVendors = async () => {
      try {
        setLoadingVendors(true);
        const { data: vendorsData, error } = await supabase
          .from('vendors')
          .select(`
            id,
            business_name,
            slug,
            category,
            location,
            images,
            primary_image,
            subscription_plan,
            reviews (rating)
          `)
          .eq('subscription_plan', 'price_1Qm0itAkjdPARDjP5L87NBDb');

        if (error) throw error;

        const vendorsWithRatings = vendorsData.map(vendor => {
          const reviews = vendor.reviews || [];
          const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
          const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
          return { ...vendor, rating: averageRating };
        });

        const shuffledVendors = shuffleArray(vendorsWithRatings); // Randomize on load
        setEliteVendors(shuffledVendors);
        setDisplayedVendors(shuffledVendors.slice(0, 3)); // Initial random 3
      } catch (error) {
        console.error('Error loading elite vendors:', error);
      } finally {
        setLoadingVendors(false);
      }
    };

    loadEliteVendors();
  }, []);

  // Rotate vendors every 30 seconds
  useEffect(() => {
    if (eliteVendors.length <= 3) return;

    let currentIndex = 0;
    const rotateVendors = () => {
      const nextIndex = (currentIndex + 3) % eliteVendors.length;
      const endIndex = Math.min(nextIndex + 3, eliteVendors.length);
      let newDisplayed = eliteVendors.slice(nextIndex, endIndex);

      if (newDisplayed.length < 3) {
        newDisplayed = [...newDisplayed, ...eliteVendors.slice(0, 3 - newDisplayed.length)];
      }

      setDisplayedVendors(newDisplayed);
      currentIndex = nextIndex;
    };

    const interval = setInterval(rotateVendors, 30000); // Rotate every 30 seconds
    return () => clearInterval(interval);
  }, [eliteVendors]);

  // Get optimized image URL for vendor
  const getOptimizedImageUrl = (vendor) => {
    const primaryIndex = vendor.primary_image || 0;
    const imageUrl = vendor.images?.[primaryIndex] || vendor.images?.[0];
    return imageUrl
      ? `${imageUrl}?auto=format&fit=crop&w=800&q=80`
      : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80';
  };

  const fallbackImage = 'https://placehold.co/800x600?text=Image+Not+Found';

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2 text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Let's find your wedding team
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Search over 500 local professionals with reviews, pricing, availability, and more.
            </p>
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search vendor category or name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Location"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit" size="lg" className="bg-teal-500 text-white hover:bg-teal-600">
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </form>
          </div>
          <div className="md:w-1/2">
            <div className="aspect-[3/2] rounded-lg overflow-hidden">
              <img
                src="https://rtzrhxxdqmnpydskixso.supabase.co/storage/v1/object/public/public_1//DSC07168.jpg"
                alt="Joyful wedding celebration"
                onError={(e) => (e.currentTarget.src = fallbackImage)}
                className="w-full h-full object-cover shadow-md"
                style={{ imageRendering: 'optimizeQuality', filter: 'blur(0.5px) contrast(1.1)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Plan Your Wedding</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: <Store />, title: "Venues", image: "https://rtzrhxxdqmnpydskixso.supabase.co/storage/v1/object/public/public_1//DSC09314.jpg" },
            { icon: <Camera />, title: "Photographers", image: "https://rtzrhxxdqmnpydskixso.supabase.co/storage/v1/object/public/public_1//Copy%20of%20SON03545.jpg" },
            { icon: <Cake />, title: "Caterers", image: "https://rtzrhxxdqmnpydskixso.supabase.co/storage/v1/object/public/public_1//_T1A3361.jpg" },
            { icon: <Music />, title: "Entertainment", image: "https://rtzrhxxdqmnpydskixso.supabase.co/storage/v1/object/public/public_1//2T1A6178_edited%20(1).jpg" },
          ].map((category) => (
            <div
              key={category.title}
              className="relative group cursor-pointer"
              onMouseEnter={() => setHoveredCategory(category.title)}
              onMouseLeave={() => setHoveredCategory(null)}
              onClick={() => navigate(`/vendors?category=${category.title}`)}
            >
              <div className="aspect-[3/2] rounded-xl overflow-hidden">
                <img
                  src={category.image}
                  alt={category.title}
                  onError={(e) => (e.currentTarget.src = fallbackImage)}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  style={{ imageRendering: 'optimizeQuality', filter: 'blur(0px) contrast(1.1)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 w-full p-4">
                  <h3 className="text-white text-lg font-semibold">{category.title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Planning Tools Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Wedding Planning Made Easy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Search />, title: "Find Vendors", description: "Browse trusted local professionals" },
              { icon: <Calendar />, title: "Book Services", description: "Schedule with confidence" },
              { icon: <MessageSquare />, title: "Get Quotes", description: "Connect directly with vendors" },
            ].map((tool) => (
              <div key={tool.title} className="text-center">
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  {tool.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{tool.title}</h3>
                <p className="text-gray-600">{tool.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button size="lg" onClick={() => navigate('/start-planning')}>
              Start Planning Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Elite Vendors Section */}
      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Featured Elite Vendors</h2>
        {loadingVendors ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-600 mt-4">Loading elite vendors...</p>
          </div>
        ) : displayedVendors.length === 0 ? (
          <p className="text-center text-gray-600">No elite vendors available at this time.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayedVendors.map((vendor) => (
              <div key={vendor.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <img
                  src={getOptimizedImageUrl(vendor)}
                  alt={vendor.business_name}
                  onError={(e) => (e.currentTarget.src = fallbackImage)}
                  className="w-full h-48 object-cover"
                  style={{ imageRendering: 'optimizeQuality', filter: 'blur(0px) contrast(1.1)' }}
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold">{vendor.business_name}</h3>
                  <p className="text-gray-600">{vendor.category}</p>
                  <div className="flex items-center mt-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="ml-1">{vendor.rating.toFixed(1)} ({vendor.reviews.length} reviews)</span>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => navigate(`/vendors/${vendor.slug}`)}
                  >
                    Contact Vendor
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Wedding Ideas & Inspiration */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Wedding Ideas & Inspiration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Spring Wedding Trends", image: "https://rtzrhxxdqmnpydskixso.supabase.co/storage/v1/object/public/public_1//DSC09826.jpg" },
              { title: "Budget-Friendly Decor", image: "https://rtzrhxxdqmnpydskixso.supabase.co/storage/v1/object/public/public_1//DSC_9376.jpg" },
              { title: "Unique Ceremony Ideas", image: "https://rtzrhxxdqmnpydskixso.supabase.co/storage/v1/object/public/public_1//DSC09415.jpg" },
              { title: "Wedding Cake Designs", image: "https://rtzrhxxdqmnpydskixso.supabase.co/storage/v1/object/public/public_1//DSC08563.jpg" },
            ].map((idea) => (
              <div key={idea.title} className="relative rounded-xl overflow-hidden">
                <img
                  src={idea.image}
                  alt={idea.title}
                  onError={(e) => (e.currentTarget.src = fallbackImage)}
                  className="w-full h-64 object-cover"
                  style={{ imageRendering: 'optimizeQuality', filter: 'blur(0px) contrast(1.1)' }}
                />
                <div className="absolute inset-0 bg-black/40 flex items-end p-4">
                  <h3 className="text-white text-lg font-semibold">{idea.title}</h3>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" onClick={() => navigate('/inspiration')}>
              See More Ideas
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Community/Reviews */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb- irregularity12">What Couples Are Saying</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Jennifer L.", review: "Found our perfect venue through Bmatchd! The process was so easy.", rating: 5 },
              { name: "Michael R.", review: "Great photographers and caterers all in one place. Highly recommend!", rating: 4 },
              { name: "Sophie K.", review: "The direct messaging feature saved us so much time.", rating: 5 },
            ].map((review) => (
              <div key={review.name} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{review.review}"</p>
                <p className="font-semibold">{review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Bmatchd Text Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Why Choose Bmatchd?</h2>
        <p className="text-lg text-gray-600 mb-4">
          Bmatchd is your premier wedding hub, designed for modern couples and vendors alike. Our goal is to simplify wedding planning, foster business growth, and build lasting connections within the wedding community. With our unique AI-driven vendor matchmaking and gamified planning experience, couples can effortlessly assemble their ideal wedding team while managing every detail with ease. Vendors benefit from specialized tools to enhance visibility, streamline operations, and collaborate with peers and clients.
        </p>
        <p className="text-lg text-gray-600">
          Whether you're a tech-savvy couple seeking a personalized, stress-free planning journey or a wedding professional looking to grow your business, Bmatchd is here to make your experience exceptional.
        </p>
      </section>

      {/* Why Bmatchd Icon Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Bmatchd?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <Heart />, title: "Personalized Matches", description: "AI-driven matchmaking for your perfect vendor team." },
            { icon: <Shield />, title: "Trusted Professionals", description: "Vetted vendors you can rely on." },
            { icon: <Clock />, title: "Save Time", description: "Gamified tools for efficient planning." },
            { icon: <DollarSign />, title: "Budget Friendly", description: "Options tailored to your financial plan." },
          ].map((reason) => (
            <div key={reason.title} className="text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                {reason.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{reason.title}</h3>
              <p className="text-gray-600">{reason.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Wedding Planning Tools Section */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Free Wedding Planning Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Calendar />, title: "Booking Manager", description: "Schedule vendor meetings and track appointments.", image: "https://rtzrhxxdqmnpydskixso.supabase.co/storage/v1/object/public/public_1//estee-janssens-aQfhbxailCs-unsplash.jpg" },
              { icon: <Users2 />, title: "Vendor Directory", description: "Explore our full list of wedding professionals.", image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80" },
              { icon: <MessageSquare />, title: "Messaging Hub", description: "Chat with vendors directly through our platform.", image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&q=80" },
            ].map((tool) => (
              <div key={tool.title} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <img
                  src={tool.image}
                  alt={tool.title}
                  onError={(e) => (e.currentTarget.src = fallbackImage)}
                  className="w-full h-40 object-cover"
                  style={{ imageRendering: 'optimizeQuality', filter: 'blur(0px) contrast(1.1)' }}
                />
                <div className="p-4 text-center">
                  <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    {tool.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{tool.title}</h3>
                  <p className="text-gray-600">{tool.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button size="lg" onClick={() => navigate('/tools')}>
              Explore All Tools
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Get Started Section */}
      <section className="relative py-24">
        <div className="absolute inset-0">
          <img
            src="https://rtzrhxxdqmnpydskixso.supabase.co/storage/v1/object/public/public_1//DSC09614.jpg"
            alt="Beautiful wedding scene"
            onError={(e) => (e.currentTarget.src = fallbackImage)}
            className="w-full h-full object-cover"
            style={{ imageRendering: 'optimizeQuality', filter: 'blur(0px) contrast(1.1)' }}
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Plan Your Dream Wedding?</h2>
          <p className="text-xl mb-8">Join thousands of couples who trust Bmatchd to make their big day perfect.</p>
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-gray-100"
              onClick={() => navigate('/start-planning')}
            >
              Start Planning
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={handleListBusiness}
            >
              List Your Business
              <Store className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Vendor CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Are You a Wedding Professional?</h2>
        <p className="text-xl text-gray-600 mb-8">
          Join our network and connect with couples planning their perfect day
        </p>
        <Button
          size="lg"
          variant="outline"
          onClick={handleListBusiness}
          className="text-lg"
        >
          List Your Business
          <Store className="w-5 h-5 ml-2" />
        </Button>
      </section>
    </div>
  );
};

export default Home;