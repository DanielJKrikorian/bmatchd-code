import React, { useEffect } from 'react'; // Added React import
import { Plus, Pencil, Trash2, Loader2, PackageCheck, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface VendorPackage {
  id: string;
  vendor_id: string;
  created_at: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

interface PackageManagerProps {
  vendorId: string;
  packageLimit: number;
  packages: VendorPackage[];
  setPackages: (newPackages: VendorPackage[]) => void;
}

const PackageManager: React.FC<PackageManagerProps> = ({ vendorId, packageLimit, packages, setPackages }) => {
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    price: '',
    features: [] as string[],
  });
  const [saving, setSaving] = React.useState(false);

  useEffect(() => {
    loadPackages();
  }, [vendorId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPackages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendor_packages')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      if (packages.length >= packageLimit && !editing) {
        toast.error(`Maximum ${packageLimit} packages allowed`);
        return;
      }

      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        toast.error('Please enter a valid price');
        return;
      }

      if (editing) {
        const { error } = await supabase
          .from('vendor_packages')
          .update({
            name: formData.name,
            description: formData.description,
            price,
            features: formData.features,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editing)
          .eq('vendor_id', vendorId);

        if (error) throw error;
        toast.success('Package updated successfully');
      } else {
        const { error } = await supabase
          .from('vendor_packages')
          .insert([
            {
              vendor_id: vendorId,
              name: formData.name,
              description: formData.description,
              price,
              features: formData.features,
            },
          ]);

        if (error) throw error;
        toast.success('Package created successfully');
      }

      setFormData({ name: '', description: '', price: '', features: [] });
      setEditing(null);
      setShowForm(false);
      await loadPackages();
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('Failed to save package');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (pkg: VendorPackage) => {
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price.toString(),
      features: pkg.features || [],
    });
    setEditing(pkg.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      const { error } = await supabase
        .from('vendor_packages')
        .delete()
        .eq('id', id)
        .eq('vendor_id', vendorId);

      if (error) throw error;
      toast.success('Package deleted successfully');
      await loadPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Failed to delete package');
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newPackages = [...packages];
    const [movedPackage] = newPackages.splice(index, 1);
    newPackages.splice(index - 1, 0, movedPackage);
    setPackages(newPackages);
  };

  const handleMoveDown = (index: number) => {
    if (index >= packages.length - 1) return;
    const newPackages = [...packages];
    const [movedPackage] = newPackages.splice(index, 1);
    newPackages.splice(index + 1, 0, movedPackage);
    setPackages(newPackages);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Service Packages</h3>
          <p className="text-sm text-gray-500">
            Create up to {packageLimit} service packages for your clients
          </p>
        </div>
        {packages.length < packageLimit && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Package
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Package Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g., Basic Coverage"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={6}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Describe what's included in this package..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Price ($)</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
                setFormData({ name: '', description: '', price: '', features: [] });
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
                <>
                  <PackageCheck className="w-4 h-4 mr-2" />
                  {editing ? 'Update Package' : 'Create Package'}
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {packages.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
            <PackageCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No packages created yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Create your first service package to display to potential clients
            </p>
          </div>
        ) : (
          packages.map((pkg, index) => (
            <div
              key={pkg.id}
              className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between"
            >
              <div>
                <h4 className="font-medium">{pkg.name}</h4>
                {pkg.description && (
                  <div className="text-gray-600 mt-1 whitespace-pre-wrap">{pkg.description}</div>
                )}
                <p className="text-lg font-semibold mt-2">
                  ${pkg.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMoveUp(index)}
                  disabled={index <= 0}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMoveDown(index)}
                  disabled={index >= packages.length - 1}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEdit(pkg)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(pkg.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PackageManager;