# EditGoalModal Testing Guide

## Overview
The `EditGoalModal` component allows users to edit existing financial goals with full form validation and API integration.

## Component Features

### ✅ Pre-filled Form Data
- Automatically populates all fields from the existing goal data
- Supports all goal properties: name, amounts, dates, priority, status, icon, color, category, description

### ✅ Comprehensive Validation
- **Required Fields**: Goal name, target amount, start date, target date
- **Date Logic**: Target date must be after start date
- **Amount Logic**: Current amount cannot exceed target amount
- **Field Limits**: Name max 255 chars, description max 1000 chars

### ✅ Real-time Updates
- Form validation triggers on every input change
- Error messages clear automatically when user fixes issues
- Progress preview updates in real-time as amounts change

### ✅ API Integration
- Sends PUT request to `/api/v1/goals/{id}`
- Handles all success and error scenarios
- Refreshes goal list on successful update

## Testing Scenarios

### 1. Basic Edit Functionality
```typescript
// Test opening modal with existing goal
const testGoal: Goal = {
  id: 1,
  user_id: 1,
  name: "Đi du lịch",
  target_amount: 50000,
  current_amount: 15000,
  start_date: "2024-01-01",
  target_date: "2024-12-31",
  description: "Trip to Japan",
  priority: 2,
  status: 1,
  icon: "✈️",
  color: "#1976d2",
  progress_percentage: 30.0,
  created_at: "2024-01-01T00:00:00",
  updated_at: "2024-01-01T00:00:00"
};

// Expected behavior:
// - Modal opens with all fields pre-filled
// - Form shows current progress (30%)
// - All dropdowns show selected values
```

### 2. Form Validation Tests
```typescript
// Test validation scenarios:

// Empty name validation
const invalidData = { ...testGoal, name: "" };
// Expected: "Goal name is required" error

// Date validation
const invalidDates = { ...testGoal, target_date: "2023-12-31" };
// Expected: "Target date must be after start date" error

// Amount validation
const invalidAmount = { ...testGoal, current_amount: 60000 };
// Expected: "Current amount cannot exceed target amount" error
```

### 3. API Update Test
```typescript
// Test successful goal update
const updatedData = {
  name: "Japan Trip 2024",
  target_amount: 55000,
  current_amount: 20000,
  description: "Extended trip to Japan and Korea"
};

// Expected API call:
// PUT /api/v1/goals/1
// Body: { name: "Japan Trip 2024", target_amount: 55000, ... }

// Expected response:
// { success: true, message: "Goal updated successfully", data: updatedGoal }
```

## Props Interface

```typescript
interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onSuccess?: () => void; // Called after successful update
}
```

## Usage Example

```tsx
import { EditGoalModal } from '@/components/goals/EditGoalModal';

function GoalsPage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    // Refresh goals list
    fetchGoals();
  };

  return (
    <div>
      {/* Goal cards with edit buttons */}
      {goals.map(goal => (
        <GoalCard 
          key={goal.id} 
          goal={goal} 
          onEdit={handleEditGoal}
        />
      ))}

      {/* Edit Modal */}
      <EditGoalModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingGoal(null);
        }}
        goal={editingGoal}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
```

## Integration with Goals Page

### Updated Goal Interface
```typescript
export interface Goal {
  id: number;
  user_id: number;
  account_id?: number;
  name: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  target_date: string;
  description?: string;
  priority: number;
  status: number;
  icon?: string;
  color?: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}
```

### Modal State Management
```typescript
// In Goals.tsx
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

// Edit goal handler
const handleEditGoal = (goal: Goal) => {
  setEditingGoal(goal);
  setIsEditModalOpen(true);
};
```

## UI/UX Features

### ✨ Enhanced User Experience
- **Modal Title**: Shows "Edit Goal: {goalName}"
- **Progress Preview**: Real-time visual feedback
- **Loading States**: Disabled form during submission
- **Success Toast**: "Goal '{name}' updated successfully"
- **Error Handling**: Clear error messages for all scenarios

### 🎨 Visual Elements
- **Icons**: Save icon in title, field icons for context
- **Colors**: Color picker with live preview
- **Status Indicators**: Color-coded priority and status options
- **Progress Bar**: Visual representation of goal completion

## Error Handling

### Client-side Validation
- Required field validation
- Date logic validation
- Amount validation
- Field length limits

### API Error Handling
```typescript
// Handles various error response formats:
// - { errors: [{ detail: "error message" }] }
// - { message: "error message" }
// - { detail: "error message" }
// - Standard error.message
```

## Testing Checklist

- [ ] Modal opens with correct goal data pre-filled
- [ ] All form fields are editable and validate correctly
- [ ] Priority and status dropdowns work
- [ ] Icon and color selectors function
- [ ] Category dropdown loads and selects properly
- [ ] Progress preview updates in real-time
- [ ] Form submission calls correct API endpoint
- [ ] Success callback refreshes goal list
- [ ] Error messages display for validation failures
- [ ] Loading states prevent multiple submissions
- [ ] Modal closes after successful update

## Known Limitations

1. **Date Restrictions**: Start date cannot be in the past (for existing goals)
2. **Category Integration**: Relies on categories API being available
3. **Currency**: Fixed to USD formatting
4. **File Size**: Component is large (~580 lines) - could be split into smaller components

## Future Enhancements

1. **Form Components**: Extract reusable form fields
2. **Validation Schema**: Use Zod for schema validation
3. **Optimistic Updates**: Update UI before API response
4. **Bulk Edit**: Support editing multiple goals
5. **Goal Templates**: Pre-defined goal templates
6. **Currency Support**: Multi-currency support
7. **Goal Tracking**: Historical progress tracking 