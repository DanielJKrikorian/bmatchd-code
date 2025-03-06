import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import BackToDashboard from '../../components/BackToDashboard';
import PackageManager from '../../components/vendor/PackageManager';

interface Vendor {
  id: string;
  user_id: string;
  package_limit?: number;
}

interface VendorPackage {
  id: string;
  vendor_id: string;
  created_at: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

const VendorPackages = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [packages, setPackages] = useState<VendorPackage[]>([]);

  const loadVendor = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/vendor/signin');
        return;
      }

      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (vendorError) throw vendorError;
      setVendor(vendorData);

      const { data: packagesData, error: packagesError } = await supabase
        .from('vendor_packages')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: true });

      if (packagesError) throw packagesError;
      const loadedPackages = packagesData || [];
      const savedOrder = localStorage.getItem(`packageOrder_${vendorData.id}`);
      if (savedOrder) {
        const orderedPackages = JSON.parse(savedOrder)
          .map((id: string) => loadedPackages.find((pkg: VendorPackage) => pkg.id === id))
          .filter(Boolean) as VendorPackage[];
        setPackages(orderedPackages);
      } else {
        setPackages(loadedPackages);
      }
    } catch (error) {
      console.error('Error loading vendor:', error);
      toast.error('Failed to load vendor profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array intentional for mount-only effect

  const savePackageOrder = (newPackages: VendorPackage[]) => {
    setPackages(newPackages);
    if (vendor) {
      localStorage.setItem(`packageOrder_${vendor.id}`, JSON.stringify(newPackages.map(pkg => pkg.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <BackToDashboard />
      {vendor && (
        <PackageManager
          vendorId={vendor.id}
          packageLimit={vendor.package_limit || 5}
          packages={packages}
          setPackages={savePackageOrder}
        />
      )}
    </div>
  );
};

export default VendorPackages;