import React, { useState } from 'react';
import { EditGoalModal } from './EditGoalModal';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';

// Example Goal data for testing
const exampleGoal = {
  id: 1,
  user_id: 1,
  account_id: 2,
  name: "Đi du lịch Nhật Bản",
  target_amount: 50000,
  current_amount: 15000,
  start_date: "2024-01-01",
  target_date: "2024-12-31",
  description: "Trip to Japan including flights, accommodation, and activities",
  priority: 2, // Medium
  status: 1,   // Ongoing
  icon: "✈️",
  color: "#1976d2",
  progress_percentage: 30.0,
  created_at: "2024-01-01T00:00:00",
  updated_at: "2024-01-15T00:00:00"
};

export function EditGoalExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGoal] = useState(exampleGoal);

  const handleEditSuccess = () => {
    console.log('Goal updated successfully! In a real app, this would refresh the goals list.');
    // In a real app, you would fetch the updated goals list here
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">EditGoalModal Example</h2>
      
      {/* Example Goal Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentGoal.icon}</span>
            <div>
              <h3 className="font-semibold text-lg">{currentGoal.name}</h3>
              <p className="text-sm text-gray-600">
                Priority: {currentGoal.priority === 1 ? 'Low' : currentGoal.priority === 2 ? 'Medium' : 'High'} • 
                Status: {currentGoal.status === 1 ? 'Ongoing' : currentGoal.status === 2 ? 'Completed' : 'Cancelled'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Edit Goal
          </Button>
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Progress:</span>
            <span className="font-medium">
              {formatCurrency(currentGoal.current_amount)} / {formatCurrency(currentGoal.target_amount)}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="h-3 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(100, (currentGoal.current_amount / currentGoal.target_amount) * 100)}%`,
                backgroundColor: currentGoal.color 
              }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>{currentGoal.progress_percentage.toFixed(1)}% complete</span>
            <span>Target: {formatDate(currentGoal.target_date)}</span>
          </div>
        </div>

        {/* Description */}
        {currentGoal.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-700">{currentGoal.description}</p>
          </div>
        )}

        {/* Goal Details */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Start Date:</span>
            <span className="ml-2 font-medium">{formatDate(currentGoal.start_date)}</span>
          </div>
          <div>
            <span className="text-gray-600">Created:</span>
            <span className="ml-2 font-medium">{formatDate(currentGoal.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-blue-900 mb-2">How to Test:</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Click the "Edit Goal" button above</li>
          <li>2. The modal will open with all fields pre-filled</li>
          <li>3. Modify any fields (name, amounts, dates, etc.)</li>
          <li>4. Watch the progress preview update in real-time</li>
          <li>5. Submit to see the API call (check console for details)</li>
        </ol>
      </div>

      {/* Integration Code Example */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Integration Code:</h4>
        <pre className="text-xs text-gray-800 overflow-x-auto">
{`// In your Goals page or component:
import { EditGoalModal } from '@/components/goals/EditGoalModal';

const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

const handleEdit = (goal: Goal) => {
  setEditingGoal(goal);
  setIsEditModalOpen(true);
};

const handleEditSuccess = () => {
  fetchGoals(); // Refresh your goals list
};

// In your JSX:
<EditGoalModal
  isOpen={isEditModalOpen}
  onClose={() => {
    setIsEditModalOpen(false);
    setEditingGoal(null);
  }}
  goal={editingGoal}
  onSuccess={handleEditSuccess}
/>`}
        </pre>
      </div>

      {/* Edit Goal Modal */}
      <EditGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        goal={currentGoal}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
} 