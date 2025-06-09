import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateGoalModal } from './CreateGoalModal';
import { Plus } from 'lucide-react';

/**
 * Example component demonstrating how to use the CreateGoalModal
 * 
 * This shows the recommended pattern for integrating the modal into your pages:
 * 1. Import the CreateGoalModal component
 * 2. Add state to control modal visibility
 * 3. Pass onSuccess callback to refresh your goals list
 */
export function GoalExample() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleGoalCreated = () => {
    // This function would typically refetch your goals list
    console.log('Goal created successfully! Refreshing goals...');
    
    // Example: refetch goals
    // await fetchGoals();
    
    // Example: invalidate react-query cache
    // queryClient.invalidateQueries(['goals']);
    
    // Close the modal
    setIsCreateModalOpen(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Goals Example</h2>
      
      <Button 
        onClick={() => setIsCreateModalOpen(true)}
        className="flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Create New Goal
      </Button>

      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleGoalCreated}
      />
    </div>
  );
}

/**
 * INTEGRATION GUIDE:
 * 
 * 1. Import the component:
 *    import { CreateGoalModal } from '@/components/goals/CreateGoalModal';
 * 
 * 2. Add state for modal visibility:
 *    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
 * 
 * 3. Add the modal to your JSX:
 *    <CreateGoalModal
 *      isOpen={isCreateModalOpen}
 *      onClose={() => setIsCreateModalOpen(false)}
 *      onSuccess={() => {
 *        // Refresh your goals list here
 *        fetchGoals();
 *        setIsCreateModalOpen(false);
 *      }}
 *    />
 * 
 * 4. Add a trigger button:
 *    <Button onClick={() => setIsCreateModalOpen(true)}>
 *      Create Goal
 *    </Button>
 * 
 * API REQUIREMENTS:
 * - The modal posts to: POST /api/v1/goals
 * - Expected payload format:
 *   {
 *     name: string (required)
 *     target_amount: number (required)
 *     current_amount?: number (optional, defaults to 0)
 *     start_date: string (required, YYYY-MM-DD format)
 *     target_date: string (required, YYYY-MM-DD format)
 *     description?: string (optional)
 *     priority?: number (optional, 1-3, defaults to 2)
 *     status?: number (optional, defaults to 1)
 *     icon?: string (optional)
 *     color?: string (optional)
 *     account_id?: number (optional)
 *   }
 * 
 * - Expected response format:
 *   {
 *     success: boolean
 *     message: string
 *     data: {
 *       id: number
 *       user_id: number
 *       name: string
 *       target_amount: number
 *       current_amount: number
 *       start_date: string
 *       target_date: string
 *       description?: string
 *       priority: number
 *       status: number
 *       icon?: string
 *       color?: string
 *       progress_percentage: number
 *       created_at: string
 *       updated_at: string
 *     }
 *   }
 */ 