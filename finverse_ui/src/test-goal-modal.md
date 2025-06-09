# Testing the CreateGoalModal Component

## Quick Test Steps

### 1. Basic Modal Functionality
- [ ] Modal opens when triggered
- [ ] Modal closes when "Cancel" button is clicked
- [ ] Modal closes when clicking the X button
- [ ] Modal closes when clicking outside (backdrop)

### 2. Form Validation
- [ ] **Required fields** show error when empty:
  - [ ] Goal name is required
  - [ ] Target amount must be > 0
  - [ ] Start date is required
  - [ ] Target date is required
- [ ] **Date validation**:
  - [ ] Target date must be after start date
  - [ ] Cannot select past dates for start date
- [ ] **Amount validation**:
  - [ ] Target amount must be positive
  - [ ] Current amount cannot exceed target amount

### 3. Form Functionality
- [ ] All form fields are editable
- [ ] Dropdowns work correctly (Priority, Icon, Color)
- [ ] Progress preview updates as amounts change
- [ ] Character count for description updates
- [ ] Loading state shows during submission

### 4. API Integration
- [ ] Successful goal creation shows success toast
- [ ] API errors show error toast with proper message
- [ ] Network errors are handled gracefully
- [ ] Loading spinner appears during submission

### 5. UI/UX Features
- [ ] Progress bar preview works correctly
- [ ] Currency formatting displays properly
- [ ] Mobile responsive design
- [ ] Icon and color selections display correctly
- [ ] Category dropdown loads (if categories exist)

## Test Data

### Valid Test Goal
```json
{
  "name": "Buy a car",
  "target_amount": 15000,
  "current_amount": 2000,
  "start_date": "2024-01-01",
  "target_date": "2024-12-31",
  "description": "Save for a reliable used car",
  "priority": 2
}
```

### Edge Cases to Test
1. **Very large amounts**: 1,000,000+
2. **Small amounts**: $1.00
3. **Long names**: 255 character names
4. **Special characters**: Emojis in descriptions
5. **Date edge cases**: Same start and target date (should fail)

## API Endpoint Verification

The modal should POST to: `POST /api/v1/goals`

### Expected Request Headers
```
Content-Type: application/json
Authorization: Bearer <jwt-token>
```

### Expected Request Body
```json
{
  "name": "Buy a car",
  "target_amount": 15000.00,
  "current_amount": 2000.00,
  "start_date": "2024-01-01",
  "target_date": "2024-12-31",
  "description": "Save for a reliable used car",
  "priority": 2,
  "status": 1,
  "icon": "🚗",
  "color": "#1976d2"
}
```

### Expected Response (Success)
```json
{
  "success": true,
  "message": "Goal created successfully",
  "data": {
    "id": 123,
    "user_id": 456,
    "name": "Buy a car",
    "target_amount": 15000.00,
    "current_amount": 2000.00,
    "start_date": "2024-01-01",
    "target_date": "2024-12-31",
    "description": "Save for a reliable used car",
    "priority": 2,
    "status": 1,
    "icon": "🚗",
    "color": "#1976d2",
    "progress_percentage": 13.33,
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T10:00:00Z"
  }
}
```

### Expected Response (Error)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "detail": "Target date must be after start date"
    }
  ]
}
```

## Browser Console Commands for Testing

Open browser dev tools and run these commands to test programmatically:

```javascript
// Test form validation
const modal = document.querySelector('[data-testid="create-goal-modal"]');
const submitBtn = modal.querySelector('button[type="submit"]');
submitBtn.click(); // Should show validation errors

// Test API call (requires authentication)
fetch('/api/v1/goals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  },
  body: JSON.stringify({
    name: "Test Goal",
    target_amount: 1000,
    start_date: "2024-01-01",
    target_date: "2024-12-31"
  })
})
.then(res => res.json())
.then(data => console.log('API Response:', data));
```

## Integration Test with Goals Page

1. Navigate to `/goals` page
2. Click "Add Goal" or "Create Goal" button
3. Fill out the form completely
4. Submit the form
5. Verify:
   - [ ] Success toast appears
   - [ ] Modal closes
   - [ ] Goals list refreshes with new goal
   - [ ] New goal appears at top of list

## Troubleshooting Common Issues

### Modal doesn't open
- Check if `isOpen` prop is being set to `true`
- Verify no JavaScript errors in console
- Check if Dialog component is properly imported

### Form validation not working
- Check browser console for validation errors
- Verify all required fields have proper validation
- Test with empty form submission

### API calls failing
- Check network tab for actual request details
- Verify authentication token is present
- Check API server is running on correct port
- Verify CORS settings if cross-origin

### Styling issues
- Check if Tailwind CSS is loaded
- Verify ShadCN components are properly configured
- Test responsive design on different screen sizes

## Performance Checklist

- [ ] Modal opens/closes smoothly without lag
- [ ] Form submission doesn't block UI
- [ ] Large dropdown lists (categories) load efficiently
- [ ] No memory leaks on repeated open/close
- [ ] Mobile performance is acceptable 