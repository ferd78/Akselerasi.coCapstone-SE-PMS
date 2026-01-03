import React, { useState } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  ChevronDown,
  Save, 
  X 
} from 'lucide-react';

// --- Types ---
interface ActionItem {
  id: string;
  title: string;
  date: string;
  description: string;
}

interface FocusArea {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  actions: ActionItem[];
}

interface Employee {
  id: number;
  name: string;
  initials: string;
  position: string;
}

const HRDevelopmentPlan = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);

  const employees: Employee[] = [
    { id: 1, name: 'Sarah Johnson', initials: 'SJ', position: 'Senior Developer' },
    { id: 2, name: 'James Wilson', initials: 'JW', position: 'Frontend Developer' },
    { id: 3, name: 'Lisa Martinez', initials: 'LM', position: 'Backend Developer' },
    { id: 4, name: 'Robert Taylor', initials: 'RT', position: 'DevOps Engineer' },
  ];

  // --- Handlers ---
  const handleAddFocusArea = () => {
    const newArea: FocusArea = {
      id: Date.now().toString(),
      title: '',
      description: '',
      priority: 'Medium',
      actions: [{ id: Math.random().toString(), title: '', date: '', description: '' }]
    };
    setFocusAreas([...focusAreas, newArea]);
  };

  const handleAddAction = (areaId: string) => {
    setFocusAreas(focusAreas.map(area => 
      area.id === areaId 
        ? { ...area, actions: [...area.actions, { id: Math.random().toString(), title: '', date: '', description: '' }] } 
        : area
    ));
  };

  const handleCancel = () => {
    setSelectedEmployee(null);
    setFocusAreas([]);
  };

  if (selectedEmployee) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800 flex flex-col items-center">
        {/* Centered Content Container */}
        <div className="w-full max-w-5xl">
          <button 
            onClick={handleCancel}
            className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
          >
            <ChevronLeft size={16} /> Back to Planning
          </button>

          <header className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Development Plan - {selectedEmployee.name}</h1>
              <p className="text-gray-500">Create and manage development objectives</p>
            </div>
            <button 
              onClick={handleAddFocusArea}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm"
            >
              <Plus size={18} /> Add Focus Area
            </button>
          </header>

          <div className="space-y-8">
            {focusAreas.map((area) => (
              <div key={area.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                {/* Focus Area Header */}
                <div className="flex gap-4 mb-4">
                  <input 
                    type="text"
                    placeholder="Focus Area Title"
                    className="flex-grow text-lg font-medium border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  />
                  <div className="relative min-w-[160px]">
                    <select className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer">
                      <option>High Priority</option>
                      <option defaultValue="Medium Priority">Medium Priority</option>
                      <option>Low Priority</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Focus Area Description */}
                <textarea 
                  placeholder="Describe the development focus area..."
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm h-20 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-none"
                />

                {/* Action Items Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-gray-700">Action Items</h4>
                    <button 
                      onClick={() => handleAddAction(area.id)}
                      className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline"
                    >
                      <Plus size={14} /> Add Action
                    </button>
                  </div>

                  {area.actions.map((action) => (
                    <div key={action.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50/30 space-y-3">
                      <div className="flex gap-4">
                        <input 
                          type="text"
                          placeholder="Action Item Title"
                          className="flex-grow border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                        />
                        <input 
                          type="text"
                          placeholder="DD/MM/YYYY"
                          className="w-40 border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                        />
                      </div>
                      <textarea 
                        placeholder="Additional details for this action item..."
                        className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm h-16 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Page Footer */}
            <div className="flex items-center gap-3 pt-6 pb-12">
              <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md">
                <Save size={18} /> Save Development Plan
              </button>
              <button 
                onClick={handleCancel}
                className="px-6 py-2 rounded-lg font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all bg-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <header className="mb-8 text-left w-full">
          <h1 className="text-2xl font-bold text-gray-900">Development Planning</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {employees.map((emp) => (
            <div 
              key={emp.id}
              onClick={() => {
                setSelectedEmployee(emp);
                handleAddFocusArea(); 
              }}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {emp.initials}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{emp.name}</h3>
                <p className="text-gray-500">{emp.position}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HRDevelopmentPlan;