import React, { useState, useEffect } from "react";
import { Project, DailyLog } from "@/src/lib/firebase";
import { getDailyLogs, saveDailyLog, deleteDailyLog } from "@/src/services/db";
import { Plus, Save, Calendar, Clock, HardHat, Package, Edit2, Trash2, Camera, X, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatDate, cn } from "@/src/lib/utils";

interface DailyLogsProps {
  project: Project;
  onUpdate?: () => void;
}

export default function DailyLogs({ project, onUpdate }: DailyLogsProps) {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Prevention and duplicate states
  const [duplicateLog, setDuplicateLog] = useState<DailyLog | null>(null);
  const [highlightedLogId, setHighlightedLogId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [project.id]);

  const loadLogs = async () => {
    setIsLoading(true);
    const data = await getDailyLogs(project.id);
    setLogs(data);
    setIsLoading(false);
  };

  const checkDuplicate = (logData: Omit<DailyLog, 'id' | 'userId' | 'projectId'>, editingId?: string) => {
    return logs.find(log => {
      if (editingId && log.id === editingId) return false;
      
      const sameDate = log.date === logData.date;
      const sameDesc = (log.description || "").trim().toLowerCase() === (logData.description || "").trim().toLowerCase();
      const sameWorkers = (log.workers || 0) === (logData.workers || 0);
      const sameHours = (log.hours || 0) === (logData.hours || 0);
      const sameMaterials = (log.materials || "").trim().toLowerCase() === (logData.materials || "").trim().toLowerCase();
      const sameNotes = (log.notes || "").trim().toLowerCase() === (logData.notes || "").trim().toLowerCase();
      const sameProgress = (log.projectProgress ?? null) === (logData.projectProgress ?? null);
      
      const logPhotos = log.photoUrls || [];
      const newPhotos = logData.photoUrls || [];
      const samePhotos = logPhotos.length === newPhotos.length && 
        logPhotos.every((url, index) => url === newPhotos[index]);

      return sameDate && sameDesc && sameWorkers && sameHours && sameMaterials && sameNotes && sameProgress && samePhotos;
    });
  };

  const handleSave = async (logData: Omit<DailyLog, 'id' | 'userId' | 'projectId'>, id?: string) => {
    // 1. Check for duplicates
    const duplicate = checkDuplicate(logData, id);
    if (duplicate) {
      setDuplicateLog(duplicate);
      return;
    }

    // 2. Prevent consecutive fast clicks
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await saveDailyLog(project.id, logData, id);
      setIsAdding(false);
      setEditingLog(null);
      await loadLogs();
      if (onUpdate) onUpdate();
    } catch (err) {
      setErrorMsg("Failed to save the log entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteLog = async () => {
    if (!deletingLogId) return;
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await deleteDailyLog(project.id, deletingLogId);
      setDeletingLogId(null);
      loadLogs();
      if (onUpdate) onUpdate();
    } catch (err) {
      setErrorMsg("Failed to delete the log entry. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-gray-900">Daily Progress Logs</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20"
        >
          <Plus size={18} />
          <span>Add Log</span>
        </button>
      </div>

      <AnimatePresence>
        {(isAdding || editingLog) && (
          <LogForm 
            log={editingLog || undefined} 
            currentProjectProgress={project.progress}
            isSaving={isSaving}
            onSave={handleSave} 
            onCancel={() => { setIsAdding(false); setEditingLog(null); }} 
          />
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length > 0 ? (
          logs.map((log) => {
            const isHighlighted = highlightedLogId === log.id;
            return (
              <motion.div 
                 layout
                 key={log.id}
                 id={`log-${log.id}`}
                 className={cn(
                   "bg-white border rounded-2xl p-5 shadow-sm space-y-4 transition-all duration-500",
                   isHighlighted 
                     ? "border-blue-500 ring-4 ring-blue-100 scale-[1.01] shadow-md bg-blue-50/10" 
                     : "border-gray-100"
                 )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-blue-600 mb-1">
                      <Calendar size={16} />
                      <span className="font-bold text-sm">{formatDate(log.date)}</span>
                    </div>
                    <h4 className="font-bold text-gray-900">{log.description}</h4>
                  </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => setEditingLog(log)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit Log"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => setDeletingLogId(log.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete Log"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-3 border-y border-gray-50 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                    <HardHat size={16} />
                  </div>
                  <div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Workers</p>
                    <p className="font-bold text-gray-900">{log.workers || 0}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                   <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Hours</p>
                    <p className="font-bold text-gray-900">{log.hours || 0}</p>
                  </div>
                </div>
                {log.projectProgress !== undefined && log.projectProgress !== null && (
                  <div className="col-span-2 flex items-center space-x-2">
                     <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                      <TrendingUp size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Project Progress</p>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900">{log.projectProgress}%</span>
                        <div className="flex-1 max-w-[120px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full animate-pulse" style={{ width: `${log.projectProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {log.materials && (
                <div className="flex items-start space-x-2">
                  <Package size={16} className="text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-600"><span className="font-bold text-gray-900">Materials:</span> {log.materials}</p>
                </div>
              )}

              {log.notes && (
                <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 border border-gray-100 italic">
                  &ldquo;{log.notes}&rdquo;
                </div>
              )}

              {log.photoUrls && log.photoUrls.length > 0 && (
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
                  {log.photoUrls.map((url, i) => (
                    <img key={i} src={url} alt="Progress" className="w-20 h-20 object-cover rounded-xl border border-gray-100 flex-shrink-0" />
                  ))}
                </div>
              )}
            </motion.div>
          );
        })
        ) : (
          <div className="text-center p-12 bg-white border border-dashed border-gray-200 rounded-3xl text-gray-400">
            <p className="text-sm">No daily logs yet. Add your first progress update!</p>
          </div>
        )}
      </div>

      {deletingLogId && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center space-y-4"
          >
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
              <Trash2 size={32} />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xl font-black text-gray-900">Delete Work Log?</h4>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Are you sure you want to delete this daily work log entry? This action is permanent and cannot be undone.
              </p>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-500 font-bold bg-red-50 py-2 px-3 rounded-lg border border-red-100">
                {errorMsg}
              </p>
            )}

            <div className="flex space-x-3 pt-2">
              <button 
                type="button"
                onClick={() => { setDeletingLogId(null); setErrorMsg(null); }}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-xl text-sm transition-colors border border-gray-200"
                disabled={isDeleting}
              >
                No, Keep It
              </button>
              <button 
                type="button"
                onClick={confirmDeleteLog}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-lg shadow-red-500/20 transition-colors flex items-center justify-center space-x-2"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Duplicate entry dialog with a direct button to scroll to and see the existing entry */}
      {duplicateLog && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-5"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
              <Calendar size={32} />
            </div>
            
            <div className="text-center space-y-2">
              <h4 className="text-xl font-black text-gray-900">Duplicate Entry Found</h4>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                An identical daily progress log already exists for this project on <span className="font-bold text-gray-900">{formatDate(duplicateLog.date)}</span>.
              </p>
            </div>

            {/* Existing log summary preview */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-3">
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Existing Entry Description</p>
                <p className="font-bold text-sm text-gray-900">{duplicateLog.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs">
                <div>
                  <p className="text-gray-400 font-bold text-[8px] uppercase">Workers</p>
                  <p className="font-bold text-gray-800">{duplicateLog.workers || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[8px] uppercase">Hours</p>
                  <p className="font-bold text-gray-800">{duplicateLog.hours || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[8px] uppercase">Progress</p>
                  <p className="font-bold text-gray-800">{duplicateLog.projectProgress}%</p>
                </div>
              </div>
              {duplicateLog.notes && (
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mb-1">Notes</p>
                  <p className="text-xs text-gray-600 italic font-medium bg-white p-2.5 rounded-xl border border-slate-100/50">
                    &ldquo;{duplicateLog.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 text-center font-medium">
              We did not create this duplicate log because everything matches the existing entry perfectly.
            </p>

            <div className="flex flex-col space-y-2 pt-2">
              <button 
                type="button"
                onClick={() => {
                  const logId = duplicateLog.id;
                  setDuplicateLog(null);
                  setIsAdding(false);
                  setEditingLog(null);
                  setHighlightedLogId(logId);
                  setTimeout(() => {
                    const element = document.getElementById(`log-${logId}`);
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                    setTimeout(() => {
                      setHighlightedLogId(null);
                    }, 4000);
                  }, 150);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
              >
                <span>Show Me Existing Entry</span>
              </button>
              
              <button 
                type="button"
                onClick={() => setDuplicateLog(null)}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-xl text-sm transition-colors border border-gray-200"
              >
                Go Back & Edit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function LogForm({ log, currentProjectProgress, isSaving, onSave, onCancel }: { log?: DailyLog; currentProjectProgress: number; isSaving: boolean; onSave: (data: any, id?: string) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    date: log?.date || new Date().toISOString().split('T')[0],
    description: log?.description || "",
    workers: log?.workers || 0,
    hours: log?.hours || 0,
    materials: log?.materials || "",
    notes: log?.notes || "",
    photoUrls: log?.photoUrls || [],
    projectProgress: log?.projectProgress !== undefined ? log.projectProgress : currentProjectProgress,
  });

  const [photoUrl, setPhotoUrl] = useState("");

  const handleAddPhoto = () => {
    if (photoUrl) {
      setFormData(prev => ({ ...prev, photoUrls: [...prev.photoUrls, photoUrl] }));
      setPhotoUrl("");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white border-2 border-blue-100 rounded-2xl p-5 shadow-xl space-y-4 relative z-10"
    >
      <div className="flex items-center justify-between">
         <h4 className="font-black text-gray-900">{log ? "Edit Daily Log" : "New Daily Log"}</h4>
         <button onClick={onCancel} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-gray-400">Date</label>
          <input 
            type="date" 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm font-bold" 
            value={formData.date}
            onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
           <label className="text-[10px] font-black uppercase text-gray-400">Description</label>
           <input 
            type="text" 
            placeholder="What was done?"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm font-bold" 
            value={formData.description}
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-gray-400">Workers</label>
          <input 
            type="number" 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm font-bold" 
            value={formData.workers}
            onChange={e => setFormData(p => ({ ...p, workers: parseInt(e.target.value) || 0 }))}
          />
        </div>
        <div className="space-y-1">
           <label className="text-[10px] font-black uppercase text-gray-400">Hours worked</label>
           <input 
            type="number" 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm font-bold" 
            value={formData.hours}
            onChange={e => setFormData(p => ({ ...p, hours: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-400">Materials used</label>
        <input 
          type="text" 
          placeholder="Cement, steel, etc."
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm font-bold" 
          value={formData.materials}
          onChange={e => setFormData(p => ({ ...p, materials: e.target.value }))}
        />
      </div>

       <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-400">Notes</label>
        <textarea 
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm font-bold h-20 resize-none" 
          value={formData.notes}
          onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-gray-400">Photos (URL)</label>
        <div className="flex space-x-2">
          <input 
            type="text" 
            placeholder="Paste image URL..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm font-bold" 
            value={photoUrl}
            onChange={e => setPhotoUrl(e.target.value)}
          />
          <button 
            type="button"
            onClick={handleAddPhoto}
            className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200"
          >
            <Camera size={20} />
          </button>
        </div>
        {formData.photoUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
             {formData.photoUrls.map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} className="w-12 h-12 rounded-lg object-cover" alt="Log" />
                  <button 
                   onClick={() => setFormData(p => ({ ...p, photoUrls: p.photoUrls.filter((_, idx) => idx !== i) }))}
                   className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
             ))}
          </div>
        )}
      </div>

      {/* Progress Sync Control */}
      <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
        <label className="text-xs font-black uppercase text-blue-800 flex items-center justify-between">
          <span>Project Progress after this log</span>
          <span className="text-sm font-black bg-blue-100 px-2.5 py-0.5 rounded-full">{formData.projectProgress}%</span>
        </label>
        
        <div className="h-2.5 bg-blue-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${formData.projectProgress}%` }}
            className="h-full bg-blue-600 rounded-full"
          />
        </div>

        <input 
          type="range" 
          className="w-full h-8 cursor-pointer accent-blue-600" 
          min="0" max="100" step="5"
          value={formData.projectProgress}
          onChange={e => setFormData(p => ({ ...p, projectProgress: parseInt(e.target.value) }))}
        />
        <p className="text-[10px] text-blue-600/70 font-bold italic">
          Adjust the slider to update the overall project completion percentage automatically.
        </p>
      </div>

      <button 
        type="button"
        disabled={isSaving}
        onClick={() => onSave(formData, log?.id)}
        className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all focus:outline-none"
      >
        {isSaving ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Save size={20} />
            <span>Save Log Entry</span>
          </>
        )}
      </button>
    </motion.div>
  );
}
