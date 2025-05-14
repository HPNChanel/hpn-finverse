import { AxiosError } from 'axios';
import api from './api';

// Types for categories
export interface Category {
  id: number;
  name: string;
  icon: string | null;
  is_expense: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  name: string;
  icon?: string;
  is_expense: boolean;
  is_default?: boolean;
}

export interface CategoryUpdate {
  name?: string;
  icon?: string;
  is_expense?: boolean;
  is_default?: boolean;
}

// Service for categories
export const categoryService = {
  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await api.get('/api/v1/categories');
      return response.data.categories;
    } catch (error) {
      const err = error as AxiosError;
      console.error('Error fetching categories:', err);
      throw err;
    }
  },

  // Get a specific category by ID
  getCategory: async (id: number): Promise<Category> => {
    try {
      const response = await api.get(`/api/v1/categories/${id}`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(`Error fetching category #${id}:`, err);
      throw err;
    }
  },

  // Create a new category
  createCategory: async (category: CategoryCreate): Promise<Category> => {
    try {
      const response = await api.post('/api/v1/categories', category);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error('Error creating category:', err);
      throw err;
    }
  },

  // Update an existing category
  updateCategory: async (id: number, category: CategoryUpdate): Promise<Category> => {
    try {
      const response = await api.put(`/api/v1/categories/${id}`, category);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(`Error updating category #${id}:`, err);
      throw err;
    }
  },

  // Delete a category
  deleteCategory: async (id: number): Promise<boolean> => {
    try {
      const response = await api.delete(`/api/v1/categories/${id}`);
      return response.data.success;
    } catch (error) {
      const err = error as AxiosError;
      console.error(`Error deleting category #${id}:`, err);
      throw err;
    }
  }
}; 