import React, { useState, useEffect } from "react";
import { Project, Category, ProjectStatus } from "@/src/lib/firebase";
import { saveProject, deleteProject } from "@/src/services/db";
import { X, Save, Trash2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface ProjectFormProps {
  project?: Project;
  categories: Category[];
  existingProjects: Project[];
  onSave: () => void;
  onCancel: () => void;
}

export default function ProjectForm({ project, categories, existingProjects, onSave, onCancel }: ProjectFormProps) {
  const [formData, setFormData] = useState<Omit<Project, 'id' | 'userId' | 'lastUpdated'>>({
    villaNum: project?.villaNum || "",
    plotNum: project?.plotNum || "",
    title: project?.title || "",
    description: project?.description || "",
    categoryId: project?.categoryId || categories[0]?.id || "",
    progress: project?.progress || 0,
    status: project?.status || "Not Started",
    startDate: project?.startDate || new Date().toISOString().split('T')[0],
    completionNotes: project?.completionNotes || "",
    completedBy: project?.completedBy || "",
    inspectorName: project?.inspectorName || "",
    inspectionStatus: project?.inspectionStatus || "Pending",
    invoiceStatus: project?.invoiceStatus || "Pending",
    invoiceNumber: project?.invoiceNumber || "",
    invoiceAmount: project?.invoiceAmount || 0,
    paymentDate: project?.paymentDate || "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!formData.categoryId && categories.length > 0) {
      setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Basic Validation
    if (!formData.villaNum || !formData.plotNum || !formData.title || !formData.categoryId) {
      setError("Please fill in all required fields.");
      setIsSaving(false);
      return;
    }

    // Duplicate Check
    const isDuplicate = existingProjects.some(p => 
      p.id !== project?.id &&
      p.villaNum.toLowerCase() === formData.villaNum.toLowerCase() &&
      p.plotNum.toLowerCase() === formData.plotNum.toLowerCase() &&
      p.categoryId === formData.categoryId
    );

    if (isDuplicate) {
      setError("This Plot and Villa combination already exists in this category.");
      setIsSaving(false);
      return;
    }

    try {
      await saveProject(formData, project?.id);
      onSave();
    } catch (err) {
      setError("Failed to save project. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!project?.id) return;
    if (!confirm("Are you sure you want to delete this project? All logs will be lost.")) return;

    try {
      await deleteProject(project.id);
      onSave();
    } catch (err) {
      setError("Failed to delete project.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-black text-gray-900">
          {project ? "Edit Project" : "New Project"}
        </h2>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-start space-x-2 text-sm">
            <AlertCircle size={18} className="mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <InputGroup label="Villa #" required>
            <input 
              type="text" 
              className="form-input" 
              value={formData.villaNum}
              onChange={e => setFormData(p => ({ ...p, villaNum: e.target.value }))}
              placeholder="e.g. 12"
            />
          </InputGroup>
          <InputGroup label="Plot #" required>
            <input 
              type="text" 
              className="form-input" 
              value={formData.plotNum}
              onChange={e => setFormData(p => ({ ...p, plotNum: e.target.value }))}
              placeholder="e.g. A-45"
            />
          </InputGroup>
        </div>

        <InputGroup label="Project/Work Title" required>
          <input 
            type="text" 
            className="form-input" 
            value={formData.title}
            onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
            placeholder="e.g. First Floor Wall Coordination"
          />
        </InputGroup>

        <InputGroup label="Work Category" required>
          <select 
            className="form-input"
            value={formData.categoryId}
            onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value }))}
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </InputGroup>

        <div className="grid grid-cols-2 gap-4">
          <InputGroup label="Status">
            <select 
              className="form-input"
              value={formData.status}
              onChange={e => setFormData(p => ({ ...p, status: e.target.value as ProjectStatus }))}
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </InputGroup>
          <InputGroup label={`Progress (${formData.progress}%)`}>
            <input 
              type="range" 
              className="w-full h-8 cursor-pointer accent-blue-600" 
              min="0" max="100" step="5"
              value={formData.progress}
              onChange={e => setFormData(p => ({ ...p, progress: parseInt(e.target.value) }))}
            />
          </InputGroup>
        </div>

        <InputGroup label="Description (Optional)">
          <textarea 
            className="form-input h-24 resize-none"
            value={formData.description}
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            placeholder="Detailed description of the work scope..."
          />
        </InputGroup>

        {formData.status === "Completed" && (
           <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-green-50 rounded-2xl space-y-4 border border-green-100"
          >
            <h3 className="font-bold text-green-800 text-sm">Completion Details</h3>
            <InputGroup label="Completed By">
               <input 
                type="text" 
                className="form-input border-green-200 bg-white" 
                value={formData.completedBy}
                onChange={e => setFormData(p => ({ ...p, completedBy: e.target.value }))}
              />
            </InputGroup>
            <InputGroup label="Notes">
               <textarea 
                className="form-input border-green-200 bg-white" 
                value={formData.completionNotes}
                onChange={e => setFormData(p => ({ ...p, completionNotes: e.target.value }))}
              />
            </InputGroup>
          </motion.div>
        )}

        <div className="pt-6 flex items-center space-x-3 border-t border-gray-100">
          <button 
            type="submit" 
            disabled={isSaving}
            className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            <Save size={20} />
            <span>{isSaving ? "Saving..." : "Save Project"}</span>
          </button>
          
          {project && (
            <button 
              type="button" 
              onClick={handleDelete}
              className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-red-100"
            >
              <Trash2 size={24} />
            </button>
          )}
        </div>
      </form>

      <style>{`
        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          outline: none;
          transition: all 0.2s;
        }
        .form-input:focus {
          background: white;
          border-color: #3b82f6;
          ring: 2px solid #3b82f6;
        }
      `}</style>
    </motion.div>
  );
}

function InputGroup({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-xs font-bold text-gray-500 uppercase flex items-center">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
