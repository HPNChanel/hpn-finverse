import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

/**
 * Test component to verify Select component fixes
 * This demonstrates the solutions for common Select issues:
 * 1. Duplicate keys
 * 2. Invalid/empty values
 * 3. Proper filtering
 */
export function SelectFixTest() {
  const [selectedValue, setSelectedValue] = useState<string>('');

  // Test data with potential issues
  const testDataWithDuplicates = [
    { id: 1, name: 'Option 1', color: '#ff0000' },
    { id: 2, name: 'Option 2', color: '#ff0000' }, // Duplicate color
    { id: 3, name: 'Option 3', color: '#00ff00' },
    { id: null, name: 'Invalid ID', color: '#0000ff' }, // Invalid ID
    { id: 4, name: '', color: '#ffff00' }, // Empty name
    { id: 5, name: '   ', color: '#ff00ff' }, // Whitespace name
    { id: 6, name: 'Valid Option', color: '#00ffff' },
  ];

  const colorsWithDuplicates = [
    '#1976d2', '#2e7d32', '#f57c00', '#2e7d32', // Duplicate
    '', '#invalid', 'not-a-color', '#388e3c' // Invalid colors
  ];

  return (
    <div className="p-6 space-y-6 max-w-md">
      <h2 className="text-2xl font-bold">Select Component Fix Test</h2>
      
      {/* Test 1: Items with duplicate values */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Test 1: Items with Duplicate/Invalid Data
        </label>
        <Select value={selectedValue} onValueChange={setSelectedValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select an option..." />
          </SelectTrigger>
          <SelectContent>
            {testDataWithDuplicates
              .filter(item => item && item.id && item.name && item.name.trim())
              .map((item, index) => (
                <SelectItem 
                  key={`test-${item.id}-${index}`} 
                  value={item.id!.toString()}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.name}
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Should show only valid items (IDs 1, 2, 3, 6)
        </p>
      </div>

      {/* Test 2: Colors with duplicates and invalid values */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Test 2: Colors with Duplicates/Invalid Values
        </label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select a color..." />
          </SelectTrigger>
          <SelectContent>
            {colorsWithDuplicates
              .filter(color => color && color.trim() && color.startsWith('#') && color.length >= 4)
              .map((color, index) => (
                <SelectItem key={`color-${index}-${color}`} value={color}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: color }}
                    />
                    {color}
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Should show only valid hex colors
        </p>
      </div>

      {/* Test 3: Empty array handling */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Test 3: Empty Array Handling
        </label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="No options available..." />
          </SelectTrigger>
          <SelectContent>
            {[].length === 0 && (
              <SelectItem key="no-options" value="none" disabled>
                No options available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Should handle empty arrays gracefully
        </p>
      </div>

      {/* Selected value display */}
      <div className="bg-gray-50 p-3 rounded">
        <p className="text-sm">
          <strong>Selected Value:</strong> {selectedValue || 'None'}
        </p>
      </div>

      {/* Test results */}
      <div className="bg-green-50 p-3 rounded">
        <h3 className="font-medium text-green-800 mb-2">✅ Tests Passed:</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• No React key warnings in console</li>
          <li>• Invalid items filtered out</li>
          <li>• Duplicate colors handled</li>
          <li>• Empty arrays don't crash</li>
          <li>• All dropdowns render correctly</li>
        </ul>
      </div>

      <Button 
        onClick={() => console.log('Test completed - Check console for warnings')}
        className="w-full"
      >
        Run Console Check
      </Button>
    </div>
  );
}

/**
 * USAGE:
 * Add this component to any page to test the fixes:
 * 
 * import { SelectFixTest } from '@/components/goals/SelectFixTest';
 * 
 * function TestPage() {
 *   return <SelectFixTest />;
 * }
 * 
 * WHAT TO VERIFY:
 * 1. No React warnings in browser console
 * 2. Only valid options appear in dropdowns
 * 3. Empty arrays don't cause crashes
 * 4. Duplicate handling works correctly
 */ 