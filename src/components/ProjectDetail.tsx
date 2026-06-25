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

  const [isEditingInspection, setIsEditingInspection] = useState(false);
  const [isEditingInvoicing, setIsEditingInvoicing] = useState(false);
  
  const [isSavingInspection, setIsSavingInspection] = useState(false);
  const [isSavingInvoicing, setIsSavingInvoicing] = useState(false);
  
  const [inspectionSuccess, setInspectionSuccess] = useState(false);
  const [invoicingSuccess, setInvoicingSuccess] = useState(false);

  const [inspectionError, setInspectionError] = useState<string | null>(null);
  const [invoicingError, setInvoicingError] = useState<string | null>(null);

  const [localInspectorName, setLocalInspectorName] = useState(project.inspectorName || "");
  const [localInspectionStatus, setLocalInspectionStatus] = useState<InspectionStatus>(project.inspectionStatus || "Pending");
  
  const [localInvoiceNumber, setLocalInvoiceNumber] = useState(project.invoiceNumber || "");
  const [localInvoiceAmount, setLocalInvoiceAmount] = useState<string>(project.invoiceAmount !== undefined ? String(project.invoiceAmount) : "");
  const [localInvoiceStatus, setLocalInvoiceStatus] = useState<InvoiceStatus>(project.invoiceStatus || "Pending");

  const inspectionInputRef = React.useRef<HTMLInputElement>(null);
  const invoiceNumberInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isEditingInspection) {
      setLocalInspectorName(project.inspectorName || "");
      setLocalInspectionStatus(project.inspectionStatus || "Pending");
    }
  }, [project.inspectorName, project.inspectionStatus, isEditingInspection]);

  React.useEffect(() => {
    if (!isEditingInvoicing) {
      setLocalInvoiceNumber(project.invoiceNumber || "");
      setLocalInvoiceAmount(project.invoiceAmount !== undefined ? String(project.invoiceAmount) : "");
      setLocalInvoiceStatus(project.invoiceStatus || "Pending");
    }
  }, [project.invoiceNumber, project.invoiceAmount, project.invoiceStatus, isEditingInvoicing]);

  const handleSaveInspection = async () => {
    setIsSavingInspection(true);
    setInspectionError(null);
    try {
      await saveProject({ 
        ...project, 
        inspectorName: localInspectorName,
        inspectionStatus: localInspectionStatus
      }, project.id);
      onUpdate();
      setInspectionSuccess(true);
      setIsEditingInspection(false);
      setTimeout(() => setInspectionSuccess(false), 2000);
    } catch (err) {
      setInspectionError("Failed to save site inspection details.");
    } finally {
      setIsSavingInspection(false);
    }
  };

  const handleSaveInvoicing = async () => {
    setIsSavingInvoicing(true);
    setInvoicingError(null);
    try {
      const amount = parseFloat(localInvoiceAmount) || 0;
      await saveProject({ 
        ...project, 
        invoiceNumber: localInvoiceNumber,
        invoiceAmount: amount,
        invoiceStatus: localInvoiceStatus
      }, project.id);
      onUpdate();
      setInvoicingSuccess(true);
      setIsEditingInvoicing(false);
      setTimeout(() => setInvoicingSuccess(false), 2000);
    } catch (err) {
      setInvoicingError("Failed to save invoice details.");
    } finally {
      setIsSavingInvoicing(false);
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
              currentStatus={localInspectionStatus}
              onStatusChange={(status) => setLocalInspectionStatus(status as any)}
              disabled={!isEditingInspection}
              options={["Pending", "Passed", "Failed"]}
              colors={{ Pending: "bg-gray-100 text-gray-600", Passed: "bg-green-100 text-green-700", Failed: "bg-red-100 text-red-700" }}
            >
               <div className="space-y-4">
                 <input 
                    ref={inspectionInputRef}
                    type="text" 
                    placeholder="Inspector Name"
                    disabled={!isEditingInspection}
                    className={cn(
                      "w-full px-5 py-4 text-sm font-semibold transition-all duration-200 outline-none rounded-2xl",
                      isEditingInspection 
                        ? "bg-white border-2 border-black text-gray-900 shadow-sm"
                        : "bg-slate-50/50 text-slate-500 border border-slate-100 cursor-not-allowed"
                    )}
                    value={localInspectorName}
                    onChange={e => setLocalInspectorName(e.target.value)}
                 />

                 {inspectionError && (
                   <p className="text-xs text-red-500 font-bold bg-red-50 p-2.5 rounded-xl border border-red-100">
                     {inspectionError}
                   </p>
                 )}

                 {inspectionSuccess && (
                   <p className="text-xs text-green-600 font-bold bg-green-50 p-2.5 rounded-xl border border-green-100">
                     ✓ Site inspection saved successfully!
                   </p>
                 )}

                 <div className="flex justify-end space-x-3 pt-2">
                   <button
                     type="button"
                     onClick={() => {
                       setIsEditingInspection(true);
                       setTimeout(() => inspectionInputRef.current?.focus(), 50);
                     }}
                     className="border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 font-bold px-6 py-2 rounded-full text-sm transition-all focus:outline-none"
                   >
                     Edit
                   </button>
                   <button
                     type="button"
                     disabled={isSavingInspection}
                     onClick={handleSaveInspection}
                     className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-full text-sm shadow-sm transition-all flex items-center justify-center space-x-1 focus:outline-none"
                   >
                     {isSavingInspection ? (
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                     ) : (
                       <span>Save</span>
                     )}
                   </button>
                 </div>
               </div>
            </StatusSection>

            {/* Invoice Status */}
            <StatusSection 
              title="Invoicing & Payment" 
              icon={<Receipt size={24} />}
              currentStatus={localInvoiceStatus}
              onStatusChange={(status) => setLocalInvoiceStatus(status as any)}
              disabled={!isEditingInvoicing}
              options={["Pending", "Invoiced", "Paid"]}
              colors={{ Pending: "bg-gray-100 text-gray-600", Invoiced: "bg-orange-100 text-orange-700", Paid: "bg-blue-100 text-blue-700" }}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input 
                      ref={invoiceNumberInputRef}
                      type="text" 
                      placeholder="Invoice #"
                      disabled={!isEditingInvoicing}
                      className={cn(
                        "w-full px-5 py-4 text-sm font-semibold transition-all duration-200 outline-none rounded-2xl",
                        isEditingInvoicing 
                          ? "bg-white border-2 border-blue-500 text-gray-900 shadow-sm"
                          : "bg-slate-50/50 text-slate-500 border border-slate-100 cursor-not-allowed"
                      )}
                      value={localInvoiceNumber}
                      onChange={e => setLocalInvoiceNumber(e.target.value)}
                  />
                  <input 
                      type="text" 
                      placeholder="Amount"
                      disabled={!isEditingInvoicing}
                      className={cn(
                        "w-full px-5 py-4 text-sm font-semibold transition-all duration-200 outline-none rounded-2xl",
                        isEditingInvoicing 
                          ? "bg-white border-2 border-blue-500 text-gray-900 shadow-sm"
                          : "bg-slate-50/50 text-slate-500 border border-slate-100 cursor-not-allowed"
                      )}
                      value={localInvoiceAmount}
                      onChange={e => setLocalInvoiceAmount(e.target.value)}
                  />
                </div>

                {invoicingError && (
                  <p className="text-xs text-red-500 font-bold bg-red-50 p-2.5 rounded-xl border border-red-100">
                    {invoicingError}
                  </p>
                )}

                {invoicingSuccess && (
                  <p className="text-xs text-green-600 font-bold bg-green-50 p-2.5 rounded-xl border border-green-100">
                    ✓ Invoice details saved successfully!
                  </p>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingInvoicing(true);
                      setTimeout(() => invoiceNumberInputRef.current?.focus(), 50);
                    }}
                    className="border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 font-bold px-6 py-2 rounded-full text-sm transition-all focus:outline-none"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={isSavingInvoicing}
                    onClick={handleSaveInvoicing}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-full text-sm shadow-sm transition-all flex items-center justify-center space-x-1 focus:outline-none"
                  >
                    {isSavingInvoicing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Save</span>
                    )}
                  </button>
                </div>
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

function StatusSection({ title, icon, currentStatus, onStatusChange, options, colors, disabled, children }: any) {
  return (
    <section className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-blue-500">{icon}</div>
          <h3 className="font-black text-gray-900">{title}</h3>
        </div>
        <div className="flex space-x-1">
          {options.map((opt: string) => {
            const isSelected = currentStatus === opt;
            return (
              <button
                key={opt}
                type="button"
                disabled={disabled}
                onClick={() => onStatusChange(opt)}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all focus:outline-none",
                  isSelected ? colors[opt] : "bg-gray-50 text-gray-300",
                  !isSelected && !disabled ? "hover:text-gray-500 hover:bg-gray-100 cursor-pointer" : "",
                  disabled ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
      {children}
    </section>
  );
}

import { Clock } from "lucide-react";
import { AnimatePresence } from "motion/react";
