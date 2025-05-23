import { useState, useEffect, useCallback } from 'react';

// Define a simple Category interface
interface Category {
  id: string;
  name: string;
  is_expense: boolean;
}

// Create a mock service since the original was removed
const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    return [
      { id: 'food', name: 'Food', is_expense: true },
      { id: 'housing', name: 'Housing', is_expense: true },
      { id: 'salary', name: 'Salary', is_expense: false },
      // Add more as needed
    ];
  }
};

interface UseCategoriesReturn {
  categories: Category[];
  expenseCategories: Category[];
  incomeCategories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
}

export const useCategories = (): UseCategoriesReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filtered categories
  const expenseCategories = categories.filter(cat => cat.is_expense);
  const incomeCategories = categories.filter(cat => !cat.is_expense);

  // Fetch all categories
  const fetchCategories = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      setError('Failed to fetch categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    expenseCategories,
    incomeCategories,
    loading,
    error,
    fetchCategories
  };
};