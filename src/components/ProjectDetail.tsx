import React, { useState } from "react";
import { Project, Category, InspectionStatus, InvoiceStatus } from "@/src/lib/firebase";
import { saveProject } from "@/src/services/db";
import DailyLogs from "./DailyLogs";
import { CheckCircle2, AlertCircle, Receipt, DollarSign, Edit, MapPin, Home, Calendar, User, ChevronLeft } from "lucide-react";
import { cn, formatDate } from "@/src/lib/utils";
import { motion } from "motion/react";

interface ProjectDetailProps {
  project: Project;
  category?: Category;
  onEdit: () => void;
  onBack: () => void;
  onUpdate: () => void;
}

export default function ProjectDetail({ project, category, onEdit, onBack, onUpdate }: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'workflow'>('overview');

  const updateWorkflow = async (updates: Partial<Project>) => {
    try {
      await saveProject({ ...project, ...updates }, project.id);
      onUpdate();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4">
          <button 
            onClick={onEdit}
            className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-2xl transition-all"
          >
            <Edit size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black uppercase tracking-tight bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
              {category?.name || "Uncategorized"}
            </span>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-tight px-3 py-1 rounded-full",
              project.status === "Completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            )}>
              {project.status}
            </span>
          </div>

          <div>
             <h2 className="text-2xl font-black text-gray-900 leading-tight">{project.title}</h2>
             <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 font-medium">
                <div className="flex items-center space-x-1.5">
                  <Home size={16} className="text-gray-300" />
                  <span>Villa {project.villaNum}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <MapPin size={16} className="text-gray-300" />
                  <span>Plot {project.plotNum}</span>
                </div>
             </div>
          </div>

          <div className="space-y-2">
             <div className="flex items-center justify-between text-xs font-black uppercase text-gray-400">
               <span>Overall Progress</span>
               <span>{project.progress}%</span>
             </div>
             <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  className="h-full bg-blue-500 rounded-full"
                />
             </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" />
        <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} label="Daily Logs" />
        <TabButton active={activeTab === 'workflow'} onClick={() => setActiveTab('workflow')} label="Workflow" />
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {project.description && (
              <section className="bg-white p-6 rounded-3xl border border-gray-100">
                <h3 className="text-xs font-black text-gray-400 uppercase mb-3">Work Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{project.description}</p>
              </section>
            )}

            <div className="grid grid-cols-2 gap-4">
               <InfoTile label="Started" value={formatDate(project.startDate)} icon={<Calendar size={18} />} />
               <InfoTile label="Updated" value={formatDate(project.lastUpdated)} icon={<Clock size={18} />} />
            </div>

            {project.status === "Completed" && (
               <section className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 space-y-4">
                  <div className="flex items-center space-x-2 text-emerald-800">
                    <CheckCircle2 size={20} />
                    <h3 className="font-bold">Completion Summary</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="text-sm">
                      <p className="text-emerald-600 font-bold text-[10px] uppercase">Completed By</p>
                      <p className="text-gray-900 font-bold">{project.completedBy || "Unknown"}</p>
                    </div>
                    {project.completionNotes && (
                      <div className="text-sm">
                        <p className="text-emerald-600 font-bold text-[10px] uppercase">Notes</p>
                        <p className="text-gray-700 italic">{project.completionNotes}</p>
                      </div>
                    )}
                  </div>
               </section>
            )}
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <DailyLogs project={project} onUpdate={onUpdate} />
          </motion.div>
        )}

        {activeTab === 'workflow' && (
          <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="space-y-6"
          >
            {/* Inspection Status */}
            <StatusSection 
              title="Site Inspection" 
              icon={<CheckCircle2 size={24} />}
              currentStatus={project.inspectionStatus || "Pending"}
              onStatusChange={(status) => updateWorkflow({ inspectionStatus: status as any })}
              options={["Pending", "Passed", "Failed"]}
              colors={{ Pending: "bg-gray-100 text-gray-600", Passed: "bg-green-100 text-green-700", Failed: "bg-red-100 text-red-700" }}
            >
               <input 
                  type="text" 
                  placeholder="Inspector Name"
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm"
                  value={project.inspectorName || ""}
                  onChange={e => updateWorkflow({ inspectorName: e.target.value })}
               />
            </StatusSection>

            {/* Invoice Status */}
            <StatusSection 
              title="Invoicing & Payment" 
              icon={<Receipt size={24} />}
              currentStatus={project.invoiceStatus || "Pending"}
              onStatusChange={(status) => updateWorkflow({ invoiceStatus: status as any })}
              options={["Pending", "Invoiced", "Paid"]}
              colors={{ Pending: "bg-gray-100 text-gray-600", Invoiced: "bg-orange-100 text-orange-700", Paid: "bg-blue-100 text-blue-700" }}
            >
              <div className="grid grid-cols-2 gap-4">
                <input 
                    type="text" 
                    placeholder="Invoice #"
                    className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm"
                    value={project.invoiceNumber || ""}
                    onChange={e => updateWorkflow({ invoiceNumber: e.target.value })}
                />
                <input 
                    type="number" 
                    placeholder="Amount"
                    className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm"
                    value={project.invoiceAmount || ""}
                    onChange={e => updateWorkflow({ invoiceAmount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </StatusSection>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-2 text-sm font-bold rounded-xl transition-all",
        active ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
      )}
    >
      {label}
    </button>
  );
}

function InfoTile({ label, value, icon }: any) {
  return (
    <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center space-x-3">
      <div className="p-2 bg-gray-50 text-gray-400 rounded-xl">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-gray-400 leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function StatusSection({ title, icon, currentStatus, onStatusChange, options, colors, children }: any) {
  return (
    <section className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-blue-500">{icon}</div>
          <h3 className="font-black text-gray-900">{title}</h3>
        </div>
        <div className="flex space-x-1">
          {options.map((opt: string) => (
            <button
              key={opt}
              onClick={() => onStatusChange(opt)}
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all",
                currentStatus === opt ? colors[opt] : "bg-gray-50 text-gray-300 hover:text-gray-500"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      {children}
    </section>
  );
}

import { Clock } from "lucide-react";
import { AnimatePresence } from "motion/react";
