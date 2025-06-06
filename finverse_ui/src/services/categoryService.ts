import api from '@/lib/api';

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  type: 'income' | 'expense' | 'both';
  parent_id?: number;
  user_id: number;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  children_count?: number;
}

export interface CategoryHierarchy extends Category {
  children: CategoryHierarchy[];
}

export interface CategoryCreate {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  type: 'income' | 'expense' | 'both';
  parent_id?: number;
}

export interface CategoryUpdate {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  type?: 'income' | 'expense' | 'both';
  parent_id?: number;
  is_active?: boolean;
}

class CategoryService {
  async getCategories(): Promise<Category[]> {
    const response = await api.get('/categories');
    // Ensure we return an array, handling different response formats
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    if (data && data.categories && Array.isArray(data.categories)) {
      return data.categories;
    }
    console.warn('Categories API returned unexpected format:', data);
    return [];
  }

  async getCategoriesHierarchy(): Promise<CategoryHierarchy[]> {
    const response = await api.get('/categories/hierarchy');
    // Ensure we return an array, handling different response formats
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    if (data && data.categories && Array.isArray(data.categories)) {
      return data.categories;
    }
    console.warn('Categories hierarchy API returned unexpected format:', data);
    return [];
  }

  async createCategory(categoryData: CategoryCreate): Promise<Category> {
    const response = await api.post('/categories', categoryData);
    return response.data;
  }

  async updateCategory(id: number, categoryData: CategoryUpdate): Promise<Category> {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  }

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  }

  async createDefaultCategories(): Promise<Category[]> {
    const response = await api.post('/categories/defaults');
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.categories)) {
      return data.categories;
    }
    return [];
  }

  filterByType(categories: Category[], type: 'income' | 'expense'): Category[] {
    // Add defensive check for array
    if (!Array.isArray(categories)) {
      console.warn('filterByType: categories is not an array', categories);
      return [];
    }
    return categories.filter(cat => cat.type === type || cat.type === 'both');
  }

  getCategoryIcon(category: Category): string {
    return category.icon || '📂';
  }

  buildCategoryPath(categories: Category[], categoryId: number): string {
    if (!Array.isArray(categories)) {
      return '';
    }
    
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return '';
    
    if (category.parent_id) {
      const parentPath = this.buildCategoryPath(categories, category.parent_id);
      return parentPath ? `${parentPath} > ${category.name}` : category.name;
    }
    
    return category.name;
  }
}

export const categoryService = new CategoryService();
export default categoryService;
