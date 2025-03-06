import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface City {
  id: string;
  name: string;
  state: string;
}

interface CitySelectProps {
  selectedCities: string[];
  onChange: (cityIds: string[]) => void;
  className?: string;
}

const STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
  'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
  'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
].sort();

const CitySelect = ({ selectedCities, onChange, className = '' }: CitySelectProps) => {
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedCityNames, setSelectedCityNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedCities.length > 0) {
      loadSelectedCityNames();
    }
  }, [selectedCities]);

  useEffect(() => {
    if (selectedState) {
      loadCities();
    }
  }, [selectedState]);

  const loadSelectedCityNames = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name, state')
        .in('id', selectedCities);

      if (error) throw error;

      const nameMap: Record<string, string> = {};
      data?.forEach(city => {
        nameMap[city.id] = `${city.name}, ${city.state}`;
      });
      setSelectedCityNames(nameMap);
    } catch (error) {
      console.error('Error loading selected city names:', error);
    }
  };

  const loadCities = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: citiesError } = await supabase
        .from('cities')
        .select('id, name, state')
        .eq('state', selectedState)
        .order('name');

      if (citiesError) throw citiesError;

      if (!data || data.length === 0) {
        setError(`No cities found for ${selectedState}`);
        setCities([]);
        return;
      }

      setCities(data);
    } catch (error) {
      console.error('Error loading cities:', error);
      setError('Failed to load cities');
      toast.error('Failed to load cities');
    } finally {
      setLoading(false);
    }
  };

  const handleCityToggle = (cityId: string) => {
    const newSelection = selectedCities.includes(cityId)
      ? selectedCities.filter(id => id !== cityId)
      : [...selectedCities, cityId];
    onChange(newSelection);
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    setSelectedState(newState);
    setCities([]);
  };

  const handleSelectAll = () => {
    if (cities.length === 0) return;
    
    const allCityIds = cities.map(city => city.id);
    const allSelected = allCityIds.every(id => selectedCities.includes(id));
    
    if (allSelected) {
      onChange(selectedCities.filter(id => !allCityIds.includes(id)));
    } else {
      onChange([...new Set([...selectedCities, ...allCityIds])]);
    }
  };

  const getSelectedCount = () => {
    return cities.filter(city => selectedCities.includes(city.id)).length;
  };

  const removeSelectedCity = (cityId: string) => {
    onChange(selectedCities.filter(id => id !== cityId));
  };

  return (
    <div className="space-y-4">
      {/* Selected Cities Display */}
      {selectedCities.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium mb-2">Selected Cities</h4>
          <div className="flex flex-wrap gap-2">
            {selectedCities.map(cityId => (
              <div
                key={cityId}
                className="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center text-sm"
              >
                <span>{selectedCityNames[cityId] || 'Loading...'}</span>
                <button
                  onClick={() => removeSelectedCity(cityId)}
                  className="ml-2 hover:text-primary/80"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* State Selection */}
      <div>
        <label htmlFor="state-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select State
        </label>
        <select
          id="state-select"
          value={selectedState}
          onChange={handleStateChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Select a state</option>
          {STATES.map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>

      {/* Cities Grid */}
      <div className="border rounded-lg p-4 max-h-[600px] overflow-y-auto">
        {error ? (
          <p className="text-red-500 text-center py-4">{error}</p>
        ) : loading && selectedState ? (
          <p className="text-gray-600 text-center py-4">Loading cities...</p>
        ) : !selectedState ? (
          <p className="text-gray-600 text-center py-4">Choose a State to see Available Cities</p>
        ) : cities.length === 0 ? (
          <p className="text-gray-600 text-center py-4">No cities found for {selectedState}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center sticky top-0 bg-white py-2">
              <h3 className="font-semibold text-gray-900">{selectedState}</h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {getSelectedCount()} selected
                </span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-primary hover:underline"
                >
                  {cities.every(city => selectedCities.includes(city.id))
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {cities.map(city => (
                <label
                  key={city.id}
                  className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCities.includes(city.id)}
                    onChange={() => handleCityToggle(city.id)}
                    className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="text-sm">
                    <div className="font-medium">{city.name}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Count */}
      <div className="text-sm text-gray-600 flex justify-between items-center">
        <span>
          {selectedCities.length} {selectedCities.length === 1 ? 'city' : 'cities'} selected
        </span>
        {selectedCities.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-sm text-red-600 hover:text-red-700 hover:underline"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

export default CitySelect;