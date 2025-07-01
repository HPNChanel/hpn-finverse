import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Folder, FolderOpen, Grid, List, Palette, Tag } from 'lucide-react';
import { categoryService, Category, CategoryHierarchy, CategoryCreate, CategoryUpdate } from '@/services/categoryService';
import { ErrorHandler, useApiError } from '@/utils/errorHandler.tsx';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hierarchyCategories, setHierarchyCategories] = useState<CategoryHierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('hierarchy');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [selectedParent, setSelectedParent] = useState<number | null>(null);
  const { toast } = useToast();
  const { handleError } = useApiError();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const [flatCategories, hierarchy] = await Promise.all([
        categoryService.getCategories(),
        categoryService.getCategoriesHierarchy()
      ]);
      setCategories(flatCategories);
      setHierarchyCategories(hierarchy);
    } catch (err) {
      const errorMessage = handleError(err, 'Fetch Categories');
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: "Failed to fetch categories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (data: CategoryCreate) => {
    try {
      await categoryService.createCategory(data);
      await fetchCategories();
      setIsCreateModalOpen(false);
      setSelectedParent(null);
      
      toast({
        title: "Success",
        description: "Category created successfully.",
      });
    } catch (err) {
      const errorMessage = handleError(err, 'Create category');
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategory = async (id: number, data: CategoryUpdate) => {
    try {
      await categoryService.updateCategory(id, data);
      await fetchCategories();
      setIsEditModalOpen(false);
      setEditingCategory(null);
      
      toast({
        title: "Success",
        description: "Category updated successfully.",
      });
    } catch (err) {
      const errorMessage = handleError(err, 'Update category');
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await categoryService.deleteCategory(id);
      setCategories(categories.filter(cat => cat.id !== id));
      setDeleteConfirm(null);
      
      toast({
        title: "Success",
        description: "Category deleted successfully.",
      });
    } catch (err) {
      const errorMessage = handleError(err, 'Delete category');
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleCreateDefaults = async () => {
    try {
      await categoryService.createDefaultCategories();
      await fetchCategories();
      
      toast({
        title: "Success",
        description: "Default categories created successfully.",
      });
    } catch (err) {
      const errorMessage = handleError(err, 'Create default categories');
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getFilteredCategories = () => {
    if (filterType === 'all') return Array.isArray(categories) ? categories : [];
    return Array.isArray(categories) 
      ? categoryService.filterByType(categories, filterType as 'income' | 'expense')
      : [];
  };

  const getFilteredHierarchy = () => {
    if (filterType === 'all') return Array.isArray(hierarchyCategories) ? hierarchyCategories : [];
    return Array.isArray(hierarchyCategories)
      ? hierarchyCategories.filter(cat => 
          cat.type === filterType || cat.type === 'both' ||
          (Array.isArray(cat.children) && cat.children.some(child => child.type === filterType || child.type === 'both'))
        )
      : [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground">Organize your income and expenses</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreateDefaults}
            className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Create Defaults
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          {error}
        </div>
      )}

      {/* Filters and View Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="all">All Categories</option>
            <option value="income">Income Only</option>
            <option value="expense">Expense Only</option>
          </select>
        </div>
        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => setViewMode('hierarchy')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'hierarchy' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Folder className="w-4 h-4 inline mr-1" />
            Hierarchy
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'list' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="w-4 h-4 inline mr-1" />
            List
          </button>
        </div>
      </div>

      {/* Categories Display */}
      {viewMode === 'hierarchy' ? (
        <HierarchyView 
          categories={getFilteredHierarchy()}
          onEdit={(category) => {
            setEditingCategory(category);
            setIsEditModalOpen(true);
          }}
          onDelete={(id) => setDeleteConfirm(id)}
          onAddChild={(parentId) => {
            setSelectedParent(parentId);
            setIsCreateModalOpen(true);
          }}
        />
      ) : (
        <ListView 
          categories={getFilteredCategories()}
          allCategories={categories}
          onEdit={(category) => {
            setEditingCategory(category);
            setIsEditModalOpen(true);
          }}
          onDelete={(id) => setDeleteConfirm(id)}
        />
      )}

      {/* Create Category Modal */}
      <CategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedParent(null);
        }}
        onSubmit={handleCreateCategory}
        categories={categories}
        parentId={selectedParent}
        title="Create Category"
      />

      {/* Edit Category Modal */}
      <CategoryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={(data) => editingCategory && handleUpdateCategory(editingCategory.id, data)}
        categories={categories}
        category={editingCategory}
        title="Edit Category"
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <DeleteConfirmDialog
          categoryName={categories.find(cat => cat.id === deleteConfirm)?.name || ''}
          onConfirm={() => handleDeleteCategory(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

// Hierarchy View Component
function HierarchyView({ 
  categories, 
  onEdit, 
  onDelete, 
  onAddChild 
}: {
  categories: CategoryHierarchy[];
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentId: number) => void;
}) {
  const renderCategory = (category: CategoryHierarchy, level: number = 0) => (
    <div key={`category-${category.id}-level-${level}`} className="space-y-2">
      <div 
        className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow"
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div className="flex items-center gap-3">
          {category.children.length > 0 ? (
            <FolderOpen className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Folder className="w-5 h-5 text-muted-foreground" />
          )}
          <span className="text-2xl">{categoryService.getCategoryIcon(category)}</span>
          <div>
            <h3 className="font-medium text-foreground">{category.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span 
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                {category.type}
              </span>
              {category.children.length > 0 && (
                <span>{category.children.length} subcategories</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onAddChild(category.id)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Add subcategory"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {category.children.map(child => renderCategory(child, level + 1))}
    </div>
  );

  return (
    <div className="space-y-4">
      {categories.map(category => renderCategory(category))}
    </div>
  );
}

// List View Component
function ListView({ 
  categories, 
  allCategories, 
  onEdit, 
  onDelete 
}: {
  categories: Category[];
  allCategories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Parent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((category) => (
              <tr key={`category-row-${category.id}`} className="hover:bg-muted/25">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{categoryService.getCategoryIcon(category)}</span>
                    <div>
                      <div className="font-medium text-foreground">{category.name}</div>
                      {category.children_count && category.children_count > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {category.children_count} subcategories
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${category.color}20`, color: category.color }}
                  >
                    {category.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {category.parent_id 
                    ? categoryService.buildCategoryPath(allCategories, category.parent_id)
                    : '—'
                  }
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {category.description || '—'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(category)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(category.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Category Modal Component
function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  category,
  parentId,
  title
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryCreate | CategoryUpdate) => void;
  categories: Category[];
  category?: Category | null;
  parentId?: number | null;
  title: string;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📂',
    color: '#6B7280',
    type: 'both' as 'income' | 'expense' | 'both',
    parent_id: parentId || undefined
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '📂',
        color: category.color || '#6B7280',
        type: category.type,
        parent_id: category.parent_id
      });
    } else {
      setFormData({
        name: '',
        description: '',
        icon: '📂',
        color: '#6B7280',
        type: 'both',
        parent_id: parentId || undefined
      });
    }
  }, [category, parentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (!submitData.parent_id) {
      delete (submitData as any).parent_id;
    }
    onSubmit(submitData);
    setFormData({
      name: '',
      description: '',
      icon: '📂',
      color: '#6B7280',
      type: 'both',
      parent_id: undefined
    });
  };

  if (!isOpen) return null;

  // Ensure categories is an array before filtering
  const categoryList = Array.isArray(categories) ? categories : [];
  const parentCategories = categoryList.filter(cat => !cat.parent_id && cat.id !== category?.id);

  const iconOptions = ['📂', '💰', '🏠', '🍽️', '🚗', '🎯', '💼', '📈', '💵', '🛒', '⚡', '☕', '🎬', '🎮', '⚽', '📱', '👕', '🏥', '✈️', '🎓'];
  const colorOptions = ['#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#84CC16', '#06B6D4'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Icon</label>
            <div className="grid grid-cols-10 gap-2 mb-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`p-2 text-xl border rounded hover:bg-muted transition-colors ${
                    formData.icon === icon ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Or enter custom icon/emoji"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="grid grid-cols-10 gap-2 mb-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded border-2 ${
                    formData.color === color ? 'border-foreground' : 'border-border'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-10 border border-input rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="both">Both Income & Expense</option>
              <option value="income">Income Only</option>
              <option value="expense">Expense Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Parent Category</label>
            <select
              value={formData.parent_id || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                parent_id: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="">No Parent (Top Level)</option>
              {parentCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {category ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Dialog - Updated to use ShadCN Dialog
function DeleteConfirmDialog({ 
  categoryName, 
  onConfirm, 
  onCancel 
}: {
  categoryName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Category</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{categoryName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
