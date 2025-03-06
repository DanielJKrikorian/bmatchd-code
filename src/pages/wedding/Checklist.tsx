import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardList, Loader2, Calendar, CheckCircle2, Circle, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import BackToDashboard from '../../components/BackToDashboard';

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  completed: boolean;
  created_at: string;
}

// Default tasks list
const DEFAULT_TASKS = [
  // 12+ Months Before
  {
    title: 'Set wedding date',
    description: 'Choose and confirm your wedding date',
    timeframe: '12+ months before'
  },
  {
    title: 'Determine budget',
    description: 'Set your total budget and break it down by category',
    timeframe: '12+ months before'
  },
  // ... rest of the default tasks
];

const calculateDueDate = (timeframe: string): string => {
  const today = new Date();
  const monthsMap: Record<string, number> = {
    '12+ months before': 12,
    '9-12 months before': 9,
    '6-9 months before': 6,
    '4-6 months before': 4,
    '2-4 months before': 2,
    '1-2 months before': 1,
    '1 week before': 0.25
  };

  const months = monthsMap[timeframe] || 12;
  const dueDate = new Date(today.setMonth(today.getMonth() + months));
  return dueDate.toISOString().split('T')[0];
};

const Checklist = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0]
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: coupleData } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!coupleData) throw new Error('Couple profile not found');

      const { data: tasks, error } = await supabase
        .from('wedding_tasks')
        .select('*')
        .eq('couple_id', coupleData.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTasks(tasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
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

      const { error } = await supabase
        .from('wedding_tasks')
        .insert([{
          couple_id: coupleData.id,
          title: formData.title,
          description: formData.description,
          due_date: formData.due_date
        }]);

      if (error) throw error;

      toast.success('Task added successfully');
      setFormData({ title: '', description: '', due_date: new Date().toISOString().split('T')[0] });
      setShowForm(false);
      loadTasks();
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    } finally {
      setSaving(false);
    }
  };

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('wedding_tasks')
        .update({ completed })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, completed } : task
        )
      );

      toast.success(completed ? 'Task completed!' : 'Task reopened');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase
        .from('wedding_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const addDefaultTasks = async () => {
    if (!confirm('This will add a set of common wedding planning tasks to your checklist. Continue?')) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: coupleData } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!coupleData) throw new Error('Couple profile not found');

      // Prepare tasks with calculated due dates
      const tasksToAdd = DEFAULT_TASKS.map(task => ({
        couple_id: coupleData.id,
        title: task.title,
        description: task.description,
        due_date: calculateDueDate(task.timeframe),
        completed: false
      }));

      // Insert tasks in batches of 10
      for (let i = 0; i < tasksToAdd.length; i += 10) {
        const batch = tasksToAdd.slice(i, i + 10);
        const { error } = await supabase
          .from('wedding_tasks')
          .insert(batch);

        if (error) throw error;
      }

      toast.success('Default tasks added successfully');
      loadTasks();
    } catch (error) {
      console.error('Error adding default tasks:', error);
      toast.error('Failed to add default tasks');
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      <BackToDashboard />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Wedding Checklist</h1>
          <p className="text-gray-600">Track your wedding planning progress</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={addDefaultTasks}>
            <ClipboardList className="w-4 h-4 mr-2" />
            Add Default Tasks
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Task Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Add New Task</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Task Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
                Due Date
              </label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ title: '', description: '', due_date: new Date().toISOString().split('T')[0] });
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
                  'Add Task'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Tasks</h2>
        </div>

        <div className="divide-y">
          {tasks.length === 0 ? (
            <div className="p-6 text-center">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks yet</h3>
              <p className="text-gray-500">
                Add tasks to keep track of your wedding planning progress
              </p>
            </div>
          ) : (
            tasks.map(task => (
              <div
                key={task.id}
                className={`p-4 hover:bg-gray-50 ${task.completed ? 'bg-gray-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => toggleTaskCompletion(task.id, !task.completed)}
                      className="mt-1"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <div>
                      <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className={`text-sm mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center mt-2 space-x-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </div>
                        {new Date(task.due_date) < new Date() && !task.completed && (
                          <div className="flex items-center text-sm text-red-500">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Overdue
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTask(task.id)}
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Checklist;