import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Loader2, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import BackToDashboard from '../../components/BackToDashboard';

interface MealOptions {
  standard_name_1: string;
  standard_description_1: string;
  standard_name_2: string;
  standard_description_2: string;
  standard_name_3: string;
  standard_description_3: string;
  vegetarian_name: string;
  vegetarian_description: string;
  vegan_name: string;
  vegan_description: string;
}

const MealOptions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vegetarianEnabled, setVegetarianEnabled] = useState(true);
  const [veganEnabled, setVeganEnabled] = useState(true);
  const [mealOptions, setMealOptions] = useState<MealOptions>({
    standard_name_1: 'Chicken',
    standard_description_1: 'Herb-roasted chicken with seasonal vegetables',
    standard_name_2: 'Fish',
    standard_description_2: 'Pan-seared salmon with roasted potatoes',
    standard_name_3: 'Beef',
    standard_description_3: 'Grilled filet mignon with garlic mashed potatoes',
    vegetarian_name: 'Vegetarian',
    vegetarian_description: 'A plant-based meal with dairy',
    vegan_name: 'Vegan',
    vegan_description: 'A fully plant-based meal'
  });

  useEffect(() => {
    loadMealOptions();
  }, []);

  const loadMealOptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: coupleData, error } = await supabase
        .from('couples')
        .select('meal_options, vegetarian_enabled, vegan_enabled')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (coupleData?.meal_options) {
        setMealOptions(coupleData.meal_options);
      }
      setVegetarianEnabled(coupleData?.vegetarian_enabled ?? true);
      setVeganEnabled(coupleData?.vegan_enabled ?? true);
    } catch (error) {
      console.error('Error loading meal options:', error);
      toast.error('Failed to load meal options');
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

      const { error } = await supabase
        .from('couples')
        .update({ 
          meal_options: mealOptions,
          vegetarian_enabled: vegetarianEnabled,
          vegan_enabled: veganEnabled
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Meal options updated successfully');
      navigate('/wedding/guests');
    } catch (error) {
      console.error('Error saving meal options:', error);
      toast.error('Failed to save meal options');
    } finally {
      setSaving(false);
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
    <div className="max-w-3xl mx-auto py-12 px-4">
      <BackToDashboard />
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h1 className="text-2xl font-semibold">Meal Options</h1>
          <p className="text-gray-600">Configure meal choices for your guests</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* First Standard Option */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Utensils className="w-5 h-5 text-primary" />
              <h3 className="font-medium text-lg">Standard Option 1</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={mealOptions.standard_name_1}
                  onChange={(e) => setMealOptions(prev => ({
                    ...prev,
                    standard_name_1: e.target.value
                  }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g., Chicken"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={mealOptions.standard_description_1}
                  onChange={(e) => setMealOptions(prev => ({
                    ...prev,
                    standard_description_1: e.target.value
                  }))}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Describe the first standard meal option..."
                />
              </div>
            </div>
          </div>

          {/* Second Standard Option */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Utensils className="w-5 h-5 text-primary" />
              <h3 className="font-medium text-lg">Standard Option 2</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={mealOptions.standard_name_2}
                  onChange={(e) => setMealOptions(prev => ({
                    ...prev,
                    standard_name_2: e.target.value
                  }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g., Fish"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={mealOptions.standard_description_2}
                  onChange={(e) => setMealOptions(prev => ({
                    ...prev,
                    standard_description_2: e.target.value
                  }))}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Describe the second standard meal option..."
                />
              </div>
            </div>
          </div>

          {/* Third Standard Option */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Utensils className="w-5 h-5 text-primary" />
              <h3 className="font-medium text-lg">Standard Option 3</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={mealOptions.standard_name_3}
                  onChange={(e) => setMealOptions(prev => ({
                    ...prev,
                    standard_name_3: e.target.value
                  }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g., Beef"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={mealOptions.standard_description_3}
                  onChange={(e) => setMealOptions(prev => ({
                    ...prev,
                    standard_description_3: e.target.value
                  }))}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Describe the third standard meal option..."
                />
              </div>
            </div>
          </div>

          {/* Vegetarian Option */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Utensils className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-lg">Vegetarian Option</h3>
              </div>
              <button
                type="button"
                onClick={() => setVegetarianEnabled(!vegetarianEnabled)}
                className="text-gray-600 hover:text-primary"
              >
                {vegetarianEnabled ? (
                  <ToggleRight className="w-8 h-8 text-primary" />
                ) : (
                  <ToggleLeft className="w-8 h-8" />
                )}
              </button>
            </div>
            {vegetarianEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={mealOptions.vegetarian_name}
                    onChange={(e) => setMealOptions(prev => ({
                      ...prev,
                      vegetarian_name: e.target.value
                    }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g., Grilled Vegetable Plate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={mealOptions.vegetarian_description}
                    onChange={(e) => setMealOptions(prev => ({
                      ...prev,
                      vegetarian_description: e.target.value
                    }))}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Describe the vegetarian option..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Vegan Option */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Utensils className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-lg">Vegan Option</h3>
              </div>
              <button
                type="button"
                onClick={() => setVeganEnabled(!veganEnabled)}
                className="text-gray-600 hover:text-primary"
              >
                {veganEnabled ? (
                  <ToggleRight className="w-8 h-8 text-primary" />
                ) : (
                  <ToggleLeft className="w-8 h-8" />
                )}
              </button>
            </div>
            {veganEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={mealOptions.vegan_name}
                    onChange={(e) => setMealOptions(prev => ({
                      ...prev,
                      vegan_name: e.target.value
                    }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g., Plant-Based Entrée"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={mealOptions.vegan_description}
                    onChange={(e) => setMealOptions(prev => ({
                      ...prev,
                      vegan_description: e.target.value
                    }))}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Describe the vegan option..."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/wedding/guests')}
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
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MealOptions;