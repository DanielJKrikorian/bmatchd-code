import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Auth from './pages/Auth';
import SignInSelection from './pages/SignInSelection';
import VendorSignIn from './pages/VendorSignIn';
import VendorRegister from './pages/VendorRegister';
import CoupleSignIn from './pages/CoupleSignIn';
import VendorSearch from './pages/VendorSearch';
import VendorMatch from './pages/VendorMatch';
import VendorProfile from './pages/VendorProfile';
import VendorPreview from './pages/VendorPreview';
import VendorContact from './pages/VendorContact';
import Dashboard from './pages/Dashboard';
import VendorSubscription from './pages/VendorSubscription';
import Messages from './pages/Messages';
import VendorMessages from './pages/vendor/VendorMessages';
import Checkout from './pages/Checkout';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import VendorSettings from './pages/vendor/VendorSettings';
import CoupleSettings from './pages/couple/CoupleSettings';
import SavedVendors from './pages/SavedVendors';
import VendorCalendar from './pages/VendorCalendar';
import AppointmentNew from './pages/AppointmentNew';
import AppointmentView from './pages/AppointmentView';
import AppointmentDetails from './pages/couple/AppointmentDetails';
import AppointmentRequest from './pages/couple/AppointmentRequest';
import CoupleAppointments from './pages/couple/CoupleAppointments';
import CoupleLeads from './pages/couple/CoupleLeads';
import MyWeddingTeam from './pages/couple/MyWeddingTeam';
import VendorReviews from './pages/VendorReviews';
import VendorStats from './pages/vendor/VendorStats';
import VendorLeads from './pages/VendorLeads';
import HelpCenter from './pages/HelpCenter';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ManagePlan from './pages/ManagePlan';
import VendorOnboarding from './pages/VendorOnboarding';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import StartPlanning from './pages/StartPlanning';
import CoupleOnboarding from './pages/CoupleOnboarding';
import CoupleAuth from './pages/CoupleAuth';
import VendorPackages from './pages/vendor/VendorPackages';
import ReviewLinks from './pages/vendor/ReviewLinks';
import Review from './pages/Review';
import Ambassador from './pages/vendor/Ambassador';
import AmbassadorApply from './pages/vendor/AmbassadorApply';
import { AnalyticsProvider } from './hooks/useAnalytics';
import BudgetPlanner from './pages/wedding/BudgetPlanner';
import GuestManager from './pages/wedding/GuestManager';
import Registry from './pages/wedding/Registry';
import SeatingPlan from './pages/wedding/SeatingPlan';
import Checklist from './pages/wedding/Checklist';
import SeatingLayoutEdit from './pages/wedding/SeatingLayoutEdit';
import CoupleProfile from './pages/CoupleProfile';
import MealOptions from './pages/wedding/MealOptions';
import PaymentPage from './pages/PaymentPage';
import { PackageProvider } from './context/PackageContext';

function App() {
  return (
    <Router>
      <HelmetProvider>
        <AnalyticsProvider>
          <PackageProvider>
            <ScrollToTop />
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Helmet>
                <title>BMATCHD - Wedding Vendor Marketplace</title>
                <meta name="description" content="Connect with trusted wedding professionals and plan your dream wedding with confidence. Find and book the perfect vendors for your special day." />
                <meta name="keywords" content="wedding vendors, wedding planning, wedding professionals, wedding marketplace" />
                <link rel="canonical" href="https://bmatchd.com" />
                <meta property="og:title" content="BMATCHD - Wedding Vendor Marketplace" />
                <meta property="og:description" content="Connect with trusted wedding professionals and plan your dream wedding with confidence." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://bmatchd.com" />
                <meta property="og:image" content="https://rtzrhxxdqmnpydskixso.supabase.co/storage/v1/object/public/public_1//bmatchd-logo.png" />
              </Helmet>
              <Navbar />
              <main className="container mx-auto px-4 py-8 flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/get-started" element={<Auth />} />
                  <Route path="/start-planning" element={<StartPlanning />} />
                  <Route path="/signin" element={<SignInSelection />} />
                  <Route path="/couple/signin" element={<CoupleSignIn />} />
                  <Route path="/couple/register" element={<CoupleAuth />} />
                  <Route path="/couple/profile/edit" element={<CoupleSettings />} />
                  <Route path="/vendor/signin" element={<VendorSignIn />} />
                  <Route path="/vendor/register" element={<VendorRegister />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/vendors" element={<VendorSearch />} />
                  <Route path="/vendors/match" element={<VendorMatch />} />
                  <Route path="/vendors/:slug" element={<VendorProfile />} />
                  <Route path="/vendors/:slug/preview" element={<VendorPreview />} />
                  <Route path="/vendors/:slug/contact" element={<VendorContact />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/subscription" element={<VendorSubscription />} />
                  <Route path="/subscription/checkout" element={<Checkout />} />
                  <Route path="/subscription/success" element={<SubscriptionSuccess />} />
                  <Route path="/subscription/manage" element={<ManagePlan />} />
                  <Route path="/vendor/messages" element={<VendorMessages />} />
                  <Route path="/vendor/packages" element={<VendorPackages />} />
                  <Route path="/couple/messages" element={<Messages />} />
                  <Route path="/vendor/settings" element={<VendorSettings />} />
                  <Route path="/saved-vendors" element={<SavedVendors />} />
                  <Route path="/calendar" element={<VendorCalendar />} />
                  <Route path="/calendar/new" element={<AppointmentNew />} />
                  <Route path="/calendar/:id" element={<AppointmentView />} />
                  <Route path="/appointments" element={<CoupleAppointments />} />
                  <Route path="/appointments/request" element={<AppointmentRequest />} />
                  <Route path="/appointments/:id" element={<AppointmentDetails />} />
                  <Route path="/couple/leads" element={<CoupleLeads />} />
                  <Route path="/couple/wedding-team" element={<MyWeddingTeam />} />
                  <Route path="/reviews" element={<VendorReviews />} />
                  <Route path="/stats" element={<VendorStats />} />
                  <Route path="/vendor/leads" element={<VendorLeads />} />
                  <Route path="/help" element={<HelpCenter />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/couple/onboarding" element={<CoupleOnboarding />} />
                  <Route path="/vendor/onboarding" element={<VendorOnboarding />} />
                  <Route path="/vendor/reviews/links" element={<ReviewLinks />} />
                  <Route path="/review" element={
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      <h2>Missing review token</h2>
                      <p>Please use the review link provided in your email.</p>
                    </div>
                  } />
                  <Route path="/review/:token" element={<Review />} />
                  <Route path="/vendor/ambassador" element={<Ambassador />} />
                  <Route path="/vendor/ambassador/apply" element={<AmbassadorApply />} />
                  <Route path="/wedding/budget" element={<BudgetPlanner />} />
                  <Route path="/wedding/guests" element={<GuestManager />} />
                  <Route path="/wedding/registry" element={<Registry />} />
                  <Route path="/wedding/seating" element={<SeatingPlan />} />
                  <Route path="/wedding/seating/:id" element={<SeatingLayoutEdit />} />
                  <Route path="/wedding/checklist" element={<Checklist />} />
                  <Route path="/wedding/meals" element={<MealOptions />} />
                  <Route path="/couples/:id" element={<CoupleProfile />} />
                  <Route path="/subscription/payment" element={<PaymentPage />} />
                </Routes>
              </main>
              <Footer />
              <Toaster position="bottom-right" />
            </div>
          </PackageProvider>
        </AnalyticsProvider>
      </HelmetProvider>
    </Router>
  );
}

export default App;