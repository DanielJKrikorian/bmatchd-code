import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout, Save, ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
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

interface SeatingLayout {
  id: string;
  name: string;
  type: 'ceremony' | 'reception';
  tables: Table[];
}

const SeatingLayoutEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [layout, setLayout] = useState<SeatingLayout | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '8'
  });

  useEffect(() => {
    loadLayout();
  }, [id]);

  const loadLayout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: layout, error } = await supabase
        .from('seating_layouts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setLayout(layout);
    } catch (error) {
      console.error('Error loading layout:', error);
      toast.error('Failed to load layout');
      navigate('/wedding/seating');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, table: Table) => {
    setSelectedTable(table);
  };

  const handleDragEnd = () => {
    setSelectedTable(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!selectedTable || !layout) return;

    const container = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - container.left) / container.width) * 100;
    const y = ((e.clientY - container.top) / container.height) * 100;

    setLayout(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tables: prev.tables.map(table =>
          table.id === selectedTable.id
            ? { ...table, x, y }
            : table
        )
      };
    });
  };

  const handleSave = async () => {
    if (!layout || saving) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('seating_layouts')
        .update({ tables: layout.tables })
        .eq('id', layout.id);

      if (error) throw error;
      toast.success('Layout saved successfully');
    } catch (error) {
      console.error('Error saving layout:', error);
      toast.error('Failed to save layout');
    } finally {
      setSaving(false);
    }
  };

  const addTable = () => {
    if (!layout) return;

    const newTable: Table = {
      id: crypto.randomUUID(),
      name: formData.name,
      capacity: parseInt(formData.capacity),
      guests: [],
      x: 50,
      y: 50
    };

    setLayout(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tables: [...prev.tables, newTable]
      };
    });

    setFormData({ name: '', capacity: '8' });
  };

  const removeTable = (tableId: string) => {
    if (!layout) return;

    setLayout(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tables: prev.tables.filter(table => table.id !== tableId)
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!layout) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Layout not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => navigate('/wedding/seating')}
        className="mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Layouts
      </Button>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{layout.name}</h1>
          <p className="text-gray-600 capitalize">{layout.type} Layout</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Layout Editor */}
        <div className="lg:col-span-3">
          <div 
            className="bg-white rounded-lg shadow-sm aspect-[4/3] relative"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {layout.tables.map(table => (
              <div
                key={table.id}
                draggable
                onDragStart={(e) => handleDragStart(e, table)}
                onDragEnd={handleDragEnd}
                className="absolute cursor-move"
                style={{
                  left: `${table.x}%`,
                  top: `${table.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <p className="font-medium text-primary">{table.name}</p>
                  <p className="text-sm text-gray-600">{table.capacity} seats</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => removeTable(table.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Add Table</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Table Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g., Table 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <Button 
                className="w-full"
                onClick={addTable}
                disabled={!formData.name}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Table
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Instructions</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Drag tables to position them</li>
              <li>• Click the trash icon to remove a table</li>
              <li>• Click Save Changes when done</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatingLayoutEdit;