import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Plus, Pencil, Trash2, Loader2, Save, Copy, Users2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import BackToDashboard from '../../components/BackToDashboard';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface Table {
  id: string;
  name: string;
  capacity: number;
  guests: string[];
  x: number;
  y: number;
}

interface Layout {
  id: string;
  name: string;
  type: 'ceremony' | 'reception';
  tables: Table[];
  created_at: string;
}

const DEFAULT_CEREMONY_LAYOUT = {
  name: 'Default Ceremony Layout',
  type: 'ceremony' as const,
  tables: [
    {
      id: 'altar',
      name: 'Altar',
      capacity: 2,
      guests: [],
      x: 50,
      y: 10
    },
    {
      id: 'family-left',
      name: 'Family (Left)',
      capacity: 20,
      guests: [],
      x: 20,
      y: 30
    },
    {
      id: 'family-right',
      name: 'Family (Right)',
      capacity: 20,
      guests: [],
      x: 80,
      y: 30
    },
    {
      id: 'guests-left',
      name: 'Guests (Left)',
      capacity: 50,
      guests: [],
      x: 20,
      y: 60
    },
    {
      id: 'guests-right',
      name: 'Guests (Right)',
      capacity: 50,
      guests: [],
      x: 80,
      y: 60
    }
  ]
};

const DEFAULT_RECEPTION_LAYOUT = {
  name: 'Default Reception Layout',
  type: 'reception' as const,
  tables: [
    {
      id: 'head-table',
      name: 'Head Table',
      capacity: 8,
      guests: [],
      x: 50,
      y: 10
    },
    {
      id: 'table-1',
      name: 'Table 1',
      capacity: 8,
      guests: [],
      x: 20,
      y: 40
    },
    {
      id: 'table-2',
      name: 'Table 2',
      capacity: 8,
      guests: [],
      x: 50,
      y: 40
    },
    {
      id: 'table-3',
      name: 'Table 3',
      capacity: 8,
      guests: [],
      x: 80,
      y: 40
    },
    {
      id: 'table-4',
      name: 'Table 4',
      capacity: 8,
      guests: [],
      x: 20,
      y: 70
    },
    {
      id: 'table-5',
      name: 'Table 5',
      capacity: 8,
      guests: [],
      x: 50,
      y: 70
    },
    {
      id: 'table-6',
      name: 'Table 6',
      capacity: 8,
      guests: [],
      x: 80,
      y: 70
    }
  ]
};

const SeatingPlan = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'reception' as 'ceremony' | 'reception'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLayouts();
  }, []);

  const loadLayouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: coupleData } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (coupleData) {
        const { data: layouts, error } = await supabase
          .from('seating_layouts')
          .select('*')
          .eq('couple_id', coupleData.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLayouts(layouts || []);
      }
    } catch (error) {
      console.error('Error loading layouts:', error);
      toast.error('Failed to load layouts');
    } finally {
      setLoading(false);
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

      // Use default layout based on type
      const defaultLayout = formData.type === 'ceremony' 
        ? DEFAULT_CEREMONY_LAYOUT 
        : DEFAULT_RECEPTION_LAYOUT;

      const { error } = await supabase
        .from('seating_layouts')
        .insert([{
          couple_id: coupleData.id,
          name: formData.name || defaultLayout.name,
          type: formData.type,
          tables: defaultLayout.tables
        }]);

      if (error) throw error;

      toast.success('Layout created successfully');
      setFormData({ name: '', type: 'reception' });
      setShowForm(false);
      loadLayouts();
    } catch (error) {
      console.error('Error creating layout:', error);
      toast.error('Failed to create layout');
    } finally {
      setSaving(false);
    }
  };

  const deleteLayout = async (id: string) => {
    if (!confirm('Are you sure you want to delete this layout?')) return;

    try {
      const { error } = await supabase
        .from('seating_layouts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Layout deleted successfully');
      loadLayouts();
    } catch (error) {
      console.error('Error deleting layout:', error);
      toast.error('Failed to delete layout');
    }
  };

  const duplicateLayout = async (layout: Layout) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: coupleData } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!coupleData) throw new Error('Couple profile not found');

      const { error } = await supabase
        .from('seating_layouts')
        .insert([{
          couple_id: coupleData.id,
          name: `${layout.name} (Copy)`,
          type: layout.type,
          tables: layout.tables
        }]);

      if (error) throw error;

      toast.success('Layout duplicated successfully');
      loadLayouts();
    } catch (error) {
      console.error('Error duplicating layout:', error);
      toast.error('Failed to duplicate layout');
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
          <h1 className="text-3xl font-bold">Seating Plan</h1>
          <p className="text-gray-600">Design your ceremony and reception layouts</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Layout
        </Button>
      </div>

      {/* Create Layout Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Create New Layout</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Layout Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., Main Reception Layout"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Layout Type
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'ceremony' | 'reception' }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ceremony">Ceremony</option>
                <option value="reception">Reception</option>
              </select>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ name: '', type: 'reception' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Layout'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Layouts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {layouts.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-sm">
            <Layout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No layouts yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first seating layout to start planning your guest arrangements
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Layout
            </Button>
          </div>
        ) : (
          layouts.map(layout => (
            <div key={layout.id} className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{layout.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{layout.type}</p>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <Users2 className="w-4 h-4 mr-1" />
                      {layout.tables.reduce((sum, table) => sum + table.capacity, 0)} seats
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => duplicateLayout(layout)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/wedding/seating/${layout.id}`)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteLayout(layout.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Layout Preview */}
                <div className="mt-4 aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-4">
                  <div className="w-full h-full relative">
                    {layout.tables.map(table => (
                      <div
                        key={table.id}
                        className="absolute w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `${table.x}%`,
                          top: `${table.y}%`
                        }}
                        title={`${table.name} (${table.capacity} seats)`}
                      >
                        {table.capacity}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SeatingPlan;