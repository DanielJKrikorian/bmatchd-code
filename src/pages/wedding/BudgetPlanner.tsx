import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Plus, Pencil, Trash2, Loader2, PieChart, Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import BackToDashboard from '../../components/BackToDashboard';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface VendorPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  vendor: {
    business_name: string;
  };
}

interface Expense {
  id: string;
  category: string;
  name: string;
  amount: number;
  vendor_id?: string | null;
  vendor_package_id?: string | null;
  vendor?: {
    business_name: string;
    category: string;
  } | null;
  vendor_package?: VendorPackage | null;
  created_at: string;
}

const CATEGORIES = [
  'Venue',
  'Catering',
  'Photography',
  'Videography',
  'Music',
  'Flowers',
  'Attire',
  'Rings',
  'Transportation',
  'Decor',
  'Invitations',
  'Favors',
  'Beauty',
  'Other'
];

const COLORS = [
  '#6FB7B7', // Primary
  '#4A90E2', // Blue
  '#50C878', // Green
  '#FFB347', // Orange
  '#FF69B4', // Pink
  '#9370DB', // Purple
  '#20B2AA', // Light Sea Green
  '#F08080', // Light Coral
  '#DEB887', // Burlywood
  '#BA55D3', // Medium Orchid
  '#4682B4', // Steel Blue
  '#D2691E', // Chocolate
  '#808000', // Olive
  '#CD5C5C', // Indian Red
];

const BudgetPlanner = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    amount: '',
    vendor_id: '',
    vendor_package_id: ''
  });
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [vendorPackages, setVendorPackages] = useState<VendorPackage[]>([]);
  const [editingBudget, setEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);

  useEffect(() => {
    loadBudgetData();
    loadVendors();
  }, []);

  const loadBudgetData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: coupleData } = await supabase
        .from('couples')
        .select('id, budget')
        .eq('user_id', user.id)
        .single();

      if (coupleData) {
        setTotalBudget(coupleData.budget || 0);

        const { data: expensesData, error: expensesError } = await supabase
          .from('wedding_expenses')
          .select(`
            *,
            vendor:vendors (
              business_name,
              category
            )
          `)
          .eq('couple_id', coupleData.id)
          .order('created_at', { ascending: false });

        if (expensesError) throw expensesError;
        setExpenses(expensesData || []);
      }
    } catch (error) {
      console.error('Error loading budget data:', error);
      toast.error('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const loadVendors = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: coupleData } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (coupleData) {
        // Get vendors that the couple has saved
        const { data: vendorsData } = await supabase
          .from('vendors')
          .select(`
            id, 
            business_name, 
            category,
            vendor_packages (
              id,
              name,
              description,
              price
            )
          `)
          .in('id', (
            await supabase
              .from('saved_vendors')
              .select('vendor_id')
              .eq('couple_id', coupleData.id)
          ).data?.map(v => v.vendor_id) || []);

        setVendors(vendorsData || []);
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const handleVendorChange = (vendorId: string) => {
    setSelectedVendor(vendorId);
    setFormData(prev => ({ ...prev, vendor_id: vendorId, vendor_package_id: '', amount: '' }));
    
    // Get packages for selected vendor
    const vendor = vendors.find(v => v.id === vendorId);
    setVendorPackages(vendor?.vendor_packages || []);
  };

  const handlePackageSelect = (pkg: VendorPackage) => {
    setFormData(prev => ({
      ...prev,
      name: pkg.name,
      amount: pkg.price.toString(),
      vendor_package_id: pkg.id
    }));
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

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      const expenseData = {
        couple_id: coupleData.id,
        category: formData.category,
        name: formData.name,
        amount,
        vendor_id: formData.vendor_id || null,
        vendor_package_id: formData.vendor_package_id || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('wedding_expenses')
          .update(expenseData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Expense updated successfully');
      } else {
        const { error } = await supabase
          .from('wedding_expenses')
          .insert([expenseData]);

        if (error) throw error;
        toast.success('Expense added successfully');
      }

      setFormData({ category: '', name: '', amount: '', vendor_id: '', vendor_package_id: '' });
      setEditingId(null);
      setShowForm(false);
      loadBudgetData();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const { error } = await supabase
        .from('wedding_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Expense deleted successfully');
      loadBudgetData();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleEdit = (expense: Expense) => {
    setFormData({
      category: expense.category,
      name: expense.name,
      amount: expense.amount.toString(),
      vendor_id: expense.vendor_id || '',
      vendor_package_id: expense.vendor_package_id || ''
    });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const getTotalSpent = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getExpensesByCategory = () => {
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    return categoryTotals;
  };

  const getRemainingBudget = () => {
    return totalBudget - getTotalSpent();
  };

  const handleExportCSV = () => {
    try {
      const headers = ['Category', 'Name', 'Amount', 'Vendor', 'Date'];
      const rows = expenses.map(expense => [
        expense.category,
        expense.name,
        expense.amount.toFixed(2),
        expense.vendor?.business_name || 'N/A',
        new Date(expense.created_at).toLocaleDateString()
      ]);

      const csvContent = [
        ['Wedding Budget Summary'],
        ['Total Budget', `$${totalBudget.toLocaleString()}`],
        ['Total Spent', `$${getTotalSpent().toLocaleString()}`],
        ['Remaining Budget', `$${getRemainingBudget().toLocaleString()}`],
        [''],
        ['Expense Details'],
        headers,
        ...rows
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `wedding_budget_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Budget exported successfully');
    } catch (error) {
      console.error('Error exporting budget:', error);
      toast.error('Failed to export budget');
    }
  };

  const handleUpdateBudget = async () => {
    if (savingBudget) return;
    
    const amount = parseFloat(newBudget);
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    setSavingBudget(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('couples')
        .update({ budget: amount })
        .eq('user_id', user.id);

      if (error) throw error;

      setTotalBudget(amount);
      setEditingBudget(false);
      setNewBudget('');
      toast.success('Budget updated successfully');
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error('Failed to update budget');
    } finally {
      setSavingBudget(false);
    }
  };

  const renderPieChart = () => {
    const categoryTotals = getExpensesByCategory();
    const totalSpent = getTotalSpent();
    
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    let currentAngle = 0;
    
    const paths = Object.entries(categoryTotals).map(([category, amount], index) => {
      const percentage = totalSpent > 0 ? (amount / totalSpent) : 0;
      const angle = percentage * 2 * Math.PI;
      
      const startX = Math.cos(currentAngle) * radius;
      const startY = Math.sin(currentAngle) * radius;
      const endX = Math.cos(currentAngle + angle) * radius;
      const endY = Math.sin(currentAngle + angle) * radius;
      
      const largeArcFlag = angle > Math.PI ? 1 : 0;
      const path = `
        M 0 0
        L ${startX} ${startY}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}
        Z
      `;
      
      const color = COLORS[index % COLORS.length];
      currentAngle += angle;
      
      return (
        <g key={category} transform="translate(100, 100)">
          <path
            d={path}
            fill={color}
            stroke="white"
            strokeWidth="1"
          >
            <title>{`${category}: $${amount.toLocaleString()} (${(percentage * 100).toFixed(1)}%)`}</title>
          </path>
        </g>
      );
    });

    return (
      <div className="w-full max-w-md mx-auto">
        <svg viewBox="0 0 200 200" className="w-full h-auto">
          {paths}
        </svg>
        <div className="grid grid-cols-2 gap-4 mt-6">
          {Object.entries(categoryTotals).map(([category, amount], index) => (
            <div key={category} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{category}</p>
                <p className="text-xs text-gray-500">${amount.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
          <h1 className="text-3xl font-bold">Wedding Budget</h1>
          <p className="text-gray-600">Track and manage your wedding expenses</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-gray-600">Total Budget</p>
                {editingBudget ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      className="w-32 rounded-md border border-gray-300 px-3 py-1 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Enter amount"
                      min="0"
                      step="0.01"
                    />
                    <Button 
                      size="sm"
                      onClick={handleUpdateBudget}
                      disabled={savingBudget}
                    >
                      {savingBudget ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Save'
                      )}
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingBudget(false);
                        setNewBudget('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-semibold">${totalBudget.toLocaleString()}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingBudget(true);
                        setNewBudget(totalBudget.toString());
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600">Total Spent</p>
              <p className="text-2xl font-semibold">${getTotalSpent().toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600">Remaining Budget</p>
              <p className="text-2xl font-semibold">${getRemainingBudget().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {showForm && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">
                {editingId ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vendor (Optional)
                  </label>
                  <select
                    value={selectedVendor}
                    onChange={(e) => handleVendorChange(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select a vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.business_name} ({vendor.category})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedVendor && vendorPackages.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Packages
                    </label>
                    <div className="space-y-2">
                      {vendorPackages.map((pkg) => (
                        <div
                          key={pkg.id}
                          onClick={() => handlePackageSelect(pkg)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            formData.vendor_package_id === pkg.id
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-primary/50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{pkg.name}</h4>
                              {pkg.description && (
                                <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                              )}
                            </div>
                            <p className="font-semibold">${pkg.price.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Expense Name
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
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({ category: '', name: '', amount: '', vendor_id: '', vendor_package_id: '' });
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
                      editingId ? 'Update Expense' : 'Add Expense'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className={showForm ? 'lg:col-span-1' : 'lg:col-span-2'}>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Budget Breakdown</h2>
              <div className="flex items-center text-sm text-gray-600">
                <PieChart className="w-4 h-4 mr-2" />
                Total Spent: ${getTotalSpent().toLocaleString()}
              </div>
            </div>
            {renderPieChart()}
          </div>
        </div>

        <div className={showForm ? 'lg:col-span-3' : 'lg:col-span-1'}>
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">Expenses</h2>
            </div>
            <div className="divide-y">
              {expenses.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No expenses added yet
                </div>
              ) : (
                expenses.map(expense => (
                  <div key={expense.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{expense.name}</h3>
                        <p className="text-sm text-gray-600">{expense.category}</p>
                        {expense.vendor && (
                          <p className="text-sm text-gray-500">
                            {expense.vendor.business_name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${expense.amount.toLocaleString()}</p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(expense)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPlanner;