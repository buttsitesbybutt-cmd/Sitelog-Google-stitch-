import React, { useState, useMemo } from "react";
import { Project, Category } from "@/src/lib/firebase";
import { Search, Plus, Filter, Clock, MapPin, Home, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";
import { cn, formatDate } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface DashboardProps {
  projects: Project[];
  categories: Category[];
  onProjectClick: (project: Project) => void;
  onNewProject: () => void;
}

export default function Dashboard({ projects, categories, onProjectClick, onNewProject }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const stats = useMemo(() => {
    const active = projects.filter(p => p.status !== "Completed").length;
    const completed = projects.filter(p => p.status === "Completed").length;
    const total = projects.length;
    return { active, completed, total };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const searchStr = `${p.title} ${p.villaNum} ${p.plotNum} ${p.description || ""}`.toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    });
  }, [projects, searchQuery]);

  const invoicedProjects = filteredProjects.filter(p => p.invoiceStatus === "Invoiced" || p.invoiceStatus === "Paid");
  const passedProjects = filteredProjects.filter(p => 
    (p.invoiceStatus === "Pending" || !p.invoiceStatus) && 
    p.inspectionStatus === "Passed"
  );
  const activeProjects = filteredProjects.filter(p => 
    !invoicedProjects.find(ip => ip.id === p.id) && 
    !passedProjects.find(pp => pp.id === p.id)
  );

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <StatCard label="Active" value={stats.active} color="blue" />
        <StatCard label="Completed" value={stats.completed} color="green" />
        <StatCard label="Total" value={stats.total} color="slate" />
      </div>

      {/* Search & Action */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search villa, plot or title..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          onClick={onNewProject}
          className="w-full md:w-auto flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all"
        >
          <Plus size={20} />
          <span>Add Project</span>
        </button>
      </div>

      {/* Active Projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 flex items-center space-x-2">
            <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
            <span>Active Site Work</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{activeProjects.length}</span>
          </h3>
        </div>
        
        <div className="grid gap-4">
          {activeProjects.length > 0 ? (
            activeProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                category={categories.find(c => c.id === project.categoryId)}
                onClick={() => onProjectClick(project)} 
              />
            ))
          ) : (
             <EmptyState message="No active projects found" />
          )}
        </div>
      </section>

      {/* Passed Inspections */}
      {passedProjects.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center space-x-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              <span>Passed Inspection</span>
              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">{passedProjects.length}</span>
            </h3>
          </div>
          <div className="grid gap-4">
            {passedProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                category={categories.find(c => c.id === project.categoryId)}
                onClick={() => onProjectClick(project)} 
              />
            ))}
          </div>
        </section>
      )}

      {/* Invoiced / Completed */}
      {invoicedProjects.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center space-x-2">
              <span className="w-2 h-6 bg-gray-400 rounded-full"></span>
              <span>Invoiced / Paid</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{invoicedProjects.length}</span>
            </h3>
          </div>
          <div className="grid gap-4">
            {invoicedProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                category={categories.find(c => c.id === project.categoryId)}
                onClick={() => onProjectClick(project)} 
                isMinimal
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: "blue" | "green" | "slate" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
  };

  return (
    <div className={cn("p-4 rounded-2xl border text-center transition-all", colors[color])}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-2xl md:text-3xl font-black">{value}</p>
    </div>
  );
}

function ProjectCard({ project, category, onClick, isMinimal }: { project: Project; category?: Category; onClick: () => void; isMinimal?: boolean; key?: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-tight bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
            {category?.name || "No Category"}
          </span>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-md",
            project.status === "Completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
          )}>
            {project.status}
          </span>
        </div>
        
        <h4 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
          {project.title}
        </h4>
        
        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Home size={14} className="text-gray-400" />
            <span>Villa {project.villaNum}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin size={14} className="text-gray-400" />
            <span>Plot {project.plotNum}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock size={14} className="text-gray-400" />
            <span>Updated {formatDate(project.lastUpdated)}</span>
          </div>
        </div>

        {!isMinimal && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase mb-1">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="ml-4 p-2 rounded-full group-hover:bg-blue-50 text-gray-300 group-hover:text-blue-500 transition-all">
        <ChevronRight size={20} />
      </div>
    </motion.button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-500">
      <AlertCircle size={40} className="mb-4 opacity-20" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
