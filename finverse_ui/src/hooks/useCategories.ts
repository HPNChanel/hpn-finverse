import { useState, useEffect, useCallback } from 'react';
import { categoryService, Category } from '../services/categoryService';

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