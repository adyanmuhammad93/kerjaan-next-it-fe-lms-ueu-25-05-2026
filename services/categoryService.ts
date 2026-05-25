import { apiClient } from './apiClient';
import { Category } from '../types';
import { TreeNode } from '../components/ui/TreeSelect';

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const data = await apiClient.get<{ categories: any[] }>('/categories');
    return (data.categories || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      parentId: item.parent_id,
      status: item.status,
      createdAt: item.created_at,
    }));
  },

  async createCategory(name: string, parentId?: string | null, status?: 'active' | 'inactive'): Promise<Category> {
    const data = await apiClient.post<{ category: any }>('/categories', { name, parentId, status });
    return {
      id: data.category.id,
      name: data.category.name,
      slug: data.category.slug,
      parentId: data.category.parent_id,
      status: data.category.status,
      createdAt: data.category.created_at,
    };
  },

  async updateCategory(id: string, name: string, parentId?: string | null, status?: 'active' | 'inactive'): Promise<void> {
    await apiClient.patch(`/categories/${id}`, { name, parentId, status });
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },

  buildCategoryTree(categories: Category[]): TreeNode[] {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    categories.forEach(c => {
      map.set(c.id, { label: c.name, value: c.name, children: [] });
    });

    categories.forEach(c => {
      const node = map.get(c.id)!;
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    const cleanEmptyChildren = (nodes: TreeNode[]) => {
      nodes.forEach(n => {
        if (n.children && n.children.length === 0) delete n.children;
        else if (n.children) cleanEmptyChildren(n.children);
      });
    };
    cleanEmptyChildren(roots);

    return roots;
  }
};