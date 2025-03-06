import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Plus, Link as LinkIcon, Package, QrCode, DollarSign, Check, Loader2, ExternalLink, Pencil, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import BackToDashboard from '../../components/BackToDashboard';
import QRCode from 'qrcode';

interface RegistryItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  link?: string;
  is_purchased: boolean;
  purchased_by?: string;
  vendor_package_id?: string;
  created_at: string;
}

interface VendorPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  vendor: {
    business_name: string;
  };
}

const Registry = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [savedPackages, setSavedPackages] = useState<VendorPackage[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [venmoQR, setVenmoQR] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    link: '',
    vendorPackageId: ''
  });

  useEffect(() => {
    loadRegistryData();
  }, []);

  const loadRegistryData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Get couple ID
      const { data: coupleData } = await supabase
        .from('couples')
        .select('id, venmo_username')
        .eq('user_id', user.id)
        .single();

      if (coupleData?.venmo_username) {
        generateVenmoQR(coupleData.venmo_username);
      }

      // Load registry items
      const { data: itemsData, error: itemsError } = await supabase
        .from('registry_items')
        .select(`
          *,
          vendor_packages (
            id,
            name,
            description,
            price,
            vendors (
              business_name
            )
          )
        `)
        .eq('couple_id', coupleData.id)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Load saved vendor packages
      const { data: packagesData, error: packagesError } = await supabase
        .from('saved_vendors')
        .select(`
          vendor:vendors (
            id,
            business_name,
            vendor_packages (
              id,
              name,
              description,
              price
            )
          )
        `)
        .eq('couple_id', coupleData.id);

      if (packagesError) throw packagesError;

      const packages = packagesData?.flatMap(sv => 
        sv.vendor.vendor_packages.map(pkg => ({
          ...pkg,
          vendor: {
            business_name: sv.vendor.business_name
          }
        }))
      ) || [];

      setSavedPackages(packages);
    } catch (error) {
      console.error('Error loading registry:', error);
      toast.error('Failed to load registry');
    } finally {
      setLoading(false);
    }
  };

  const generateVenmoQR = async (username: string) => {
    try {
      const venmoUrl = `https://venmo.com/${username}`;
      const qrDataUrl = await QRCode.toDataURL(venmoUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#6FB7B7',
          light: '#FFFFFF'
        }
      });
      setVenmoQR(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: coupleData } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!coupleData) throw new Error('Couple profile not found');

      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        toast.error('Please enter a valid price');
        return;
      }

      const itemData = {
        couple_id: coupleData.id,
        name: formData.name,
        description: formData.description,
        price,
        link: formData.link || null,
        vendor_package_id: formData.vendorPackageId || null
      };

      if (editingId) {
        // Update existing item
        const { error: updateError } = await supabase
          .from('registry_items')
          .update(itemData)
          .eq('id', editingId);

        if (updateError) throw updateError;
        toast.success('Item updated successfully');
      } else {
        // Create new item
        const { error: createError } = await supabase
          .from('registry_items')
          .insert([itemData]);

        if (createError) throw createError;
        toast.success('Item added successfully');
      }

      setFormData({ name: '', description: '', price: '', link: '', vendorPackageId: '' });
      setEditingId(null);
      setShowForm(false);
      loadRegistryData();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handlePackageSelect = (pkg: VendorPackage) => {
    setFormData({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price.toString(),
      link: '',
      vendorPackageId: pkg.id
    });
  };

  const handleEdit = (item: RegistryItem) => {
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      link: item.link || '',
      vendorPackageId: item.vendor_package_id || ''
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const togglePurchased = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('registry_items')
        .update({
          is_purchased: !currentStatus,
          purchased_by: currentStatus ? null : 'Guest',
          purchased_at: currentStatus ? null : new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      toast.success(currentStatus ? 'Item unmarked as purchased' : 'Item marked as purchased');
      loadRegistryData();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
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
    <div className="max-w-6xl mx-auto py-8 px-4">
      <BackToDashboard />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Wedding Registry</h1>
          <p className="text-gray-600">Manage your gift registry</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Venmo QR Code */}
      {venmoQR && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Venmo Payment Option</h2>
          <img 
            src={venmoQR} 
            alt="Venmo QR Code"
            className="mx-auto mb-4"
          />
          <p className="text-gray-600">
            Scan to send a Venmo payment for registry items
          </p>
        </div>
      )}

      {/* Add/Edit Item Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">
            {editingId ? 'Edit Registry Item' : 'Add Registry Item'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Item Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price ($)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Link (Optional)
              </label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="https://..."
              />
            </div>

            {!editingId && savedPackages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Or Select a Vendor Package
                </label>
                <div className="grid gap-4">
                  {savedPackages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => handlePackageSelect(pkg)}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        formData.vendorPackageId === pkg.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{pkg.name}</h3>
                          <p className="text-sm text-gray-600">{pkg.vendor.business_name}</p>
                          {pkg.description && (
                            <p className="text-sm text-gray-600 mt-2">{pkg.description}</p>
                          )}
                        </div>
                        <p className="font-semibold">${pkg.price.toLocaleString()}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ name: '', description: '', price: '', link: '', vendorPackageId: '' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingId ? 'Update Item' : 'Add Item'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Registry Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-sm">
            <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No items yet</h2>
            <p className="text-gray-600 mb-6">
              Add items to your registry for your guests to purchase
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Item
            </Button>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                item.is_purchased ? 'opacity-75' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-semibold text-lg ${
                      item.is_purchased ? 'line-through text-gray-500' : ''
                    }`}>
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-gray-600 mt-1">{item.description}</p>
                    )}
                    <div className="flex items-center mt-2 space-x-4">
                      <p className="text-lg font-semibold">
                        ${item.price.toLocaleString()}
                      </p>
                      {item.is_purchased && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check className="w-3 h-3 mr-1" />
                          Purchased
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => togglePurchased(item.id, item.is_purchased)}
                  >
                    {item.is_purchased ? (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Unmark as Purchased
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Mark as Purchased
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Registry;