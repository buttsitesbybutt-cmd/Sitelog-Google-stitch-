import React, { useState } from "react";
import { Category } from "@/src/lib/firebase";
import { saveCategory, deleteCategory } from "@/src/services/db";
import { Plus, Trash2, ArrowUp, ArrowDown, Edit2, Check, X, GripVertical } from "lucide-react";
import { motion, Reorder } from "motion/react";
import { cn } from "@/src/lib/utils";

interface CategoryManagerProps {
  categories: Category[];
  onUpdate: () => void;
}

export default function CategoryManager({ categories, onUpdate }: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!newCategoryName.trim()) return;
    const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.order)) : 0;
    await saveCategory({ name: newCategoryName, order: maxOrder + 1 });
    setNewCategoryName("");
    setIsAdding(false);
    onUpdate();
  };

  const handleUpdate = async (id: string, name: string, order: number) => {
    await saveCategory({ name, order }, id);
    setEditingId(null);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure? Removing a category will break filtering for projects using it.")) {
      await deleteCategory(id);
      onUpdate();
    }
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    // Swap orders
    const current = newCategories[index];
    const target = newCategories[targetIndex];
    
    const currentOrder = current.order;
    current.order = target.order;
    target.order = currentOrder;

    await Promise.all([
      saveCategory({ name: current.name, order: current.order }, current.id),
      saveCategory({ name: target.name, order: target.order }, target.id)
    ]);
    onUpdate();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">Manage Work Categories</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20"
        >
          <Plus size={18} />
          <span>New Category</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {isAdding && (
          <div className="p-4 bg-blue-50 flex items-center space-x-3 border-b border-gray-100">
            <input 
              autoFocus
              type="text" 
              placeholder="Category name (e.g. Plumbing)"
              className="flex-1 bg-white border border-blue-200 rounded-xl px-4 py-2 outline-none"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button onClick={handleAdd} className="p-2 bg-blue-600 text-white rounded-xl">
              <Check size={20} />
            </button>
            <button onClick={() => setIsAdding(false)} className="p-2 text-gray-400">
              <X size={20} />
            </button>
          </div>
        )}

        <div className="divide-y divide-gray-50">
          {categories.map((category, index) => (
            <div key={category.id} className="p-4 flex items-center justify-between group hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="flex flex-col space-y-1">
                  <button 
                    disabled={index === 0}
                    onClick={() => moveCategory(index, 'up')}
                    className="p-1 text-gray-300 hover:text-blue-500 disabled:opacity-0 transition-all"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button 
                    disabled={index === categories.length - 1}
                    onClick={() => moveCategory(index, 'down')}
                    className="p-1 text-gray-300 hover:text-blue-500 disabled:opacity-0 transition-all"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>

                {editingId === category.id ? (
                  <input 
                    autoFocus
                    type="text" 
                    className="bg-white border border-blue-300 rounded-lg px-3 py-1 outline-none text-sm font-bold"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUpdate(category.id, editName, category.order)}
                    onBlur={() => setEditingId(null)}
                  />
                ) : (
                  <span className="font-bold text-gray-700">{category.name}</span>
                )}
              </div>

              <div className="flex items-center space-x-2 transition-all">
                <button 
                  onClick={() => { setEditingId(category.id); setEditName(category.name); }}
                  className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                  title="Edit Category Name"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(category.id)}
                  className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                  title="Delete Category"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          
          {categories.length === 0 && !isAdding && (
             <div className="p-12 text-center text-gray-400 italic">
               No categories yet. Add one to get started!
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
