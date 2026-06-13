import { saveCategory, saveProject, saveDailyLog, getCategories, getProjects } from "./db";
import { auth, Category, Project } from "@/src/lib/firebase";

const rawCsvData = `Date,Project,Category,Description,Workers,Hours,Material
2026-05-16,Plot 3,RF Wall Coordination,1 vila,2,20,
2026-05-16,Plot 29,GF Wall Coordination,Marking For Cutting,,,
2026-05-16,Plot 30,GF Wall Coordination,Marking for Cutting,,,
2026-05-15,Plot 35,External & Pump Room Piping,Inspection for Lift Right side of 4BR has been passed,,,
2026-05-15,Plot 3,RF Wall Coordination,1 vila piping,2,20,
2026-05-14,Plot 6,GF Wall Coordination,GF Marking For Cutting,,,
2026-05-14,Plot 18,FF Wall Coordination,3 Vila box fixing,2,26,
2026-05-13,Plot 18,GF Wall Coordination,All work complete,,,
2026-05-13,Plot 18,FF Wall Coordination,FF Wall marking,,,
2026-05-13,Plot 38,GF DB Piping,3BR plus 3BR,2,26,
2026-05-12,Plot 18,GF DB Piping,3BR GF DB complete,2,20,
2026-05-12,Plot 32,RF Wall Coordination,2 vila piping,2,20,
2026-05-12,Plot 38,GF DB Piping,1 villa 4BR GF DB Fixing,2,20,
2026-05-12,Plot 32,RF Wall Coordination,2 Vila,2,20,
2026-05-11,Plot 18,GF DB Piping,"1 electrical DB in 4BR 
1 Data DB in 4BR 
1 3BR ele data db",4,40,
2026-05-11,Plot 36,GF DB Piping,"4BR piping complete 
4BR data complete",2,20,
2026-05-11,Plot 36,GF DB Piping,"3BR GF DB complete 
3BR GF DB complete",2,20,
2026-05-09,Plot 36,GF DB Piping,"1 4BR complete 
1 4BR onu complete",2,20,
2026-05-07,Plot 3,RF Wall Coordination,2 vila piping,4,40,`;

export const importLegacyData = async () => {
  if (!auth.currentUser) throw new Error("User must be logged in to import data");

  // Better CSV parser that handles newlines inside quotes
  const parseCSV = (text: string) => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Double quotes inside quotes means a literal quote
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField);
        currentField = "";
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (currentField || currentRow.length > 0) {
          currentRow.push(currentField);
          rows.push(currentRow);
          currentRow = [];
          currentField = "";
        }
        if (char === '\r' && nextChar === '\n') i++; // Skip \n after \r
      } else {
        currentField += char;
      }
    }
    
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }
    return rows;
  };

  const allRows = parseCSV(rawCsvData);
  const rows = allRows.slice(1); // Skip header
  
  // 1. Get existing data to avoid duplicates
  let existingCategories = await getCategories();
  let existingProjects = await getProjects();

  for (const parts of rows) {
    if (parts.length < 3 || !parts[1] || !parts[2]) continue;

    const [date, projectStr, categoryName, description, workers, hours, materials] = parts;

    // A. Handle Category
    let category = existingCategories.find(c => c.name?.toLowerCase() === categoryName.toLowerCase());
    if (!category) {
      const id = await saveCategory({ name: categoryName, order: existingCategories.length });
      category = { id: id!, name: categoryName, order: existingCategories.length, userId: auth.currentUser.uid };
      existingCategories.push(category);
    }

    // B. Handle Project
    const plotNum = (projectStr || "").replace("Plot ", "").trim();
    if (!plotNum) continue;

    const villaNum = plotNum; 
    const projectTitle = `${categoryName} - Plot ${plotNum}`;

    let project = existingProjects.find(p => p.plotNum === plotNum && p.categoryId === category!.id);
    if (!project) {
        const projData = {
            villaNum,
            plotNum,
            title: projectTitle,
            description: `Legacy project: ${projectStr}`,
            categoryId: category.id,
            progress: 100,
            status: "Completed" as any,
            startDate: date || new Date().toISOString().split('T')[0],
        };
        const id = await saveProject(projData);
        project = { id: id!, ...projData, userId: auth.currentUser.uid, lastUpdated: new Date().toISOString() };
        existingProjects.push(project);
    }

    // C. Create Daily Log
    if (description) {
      await saveDailyLog(project.id, {
          date: date || new Date().toISOString().split('T')[0],
          description: description.trim(),
          workers: parseInt(workers) || 0,
          hours: parseFloat(hours) || 0,
          materials: (materials || "").trim(),
      });
    }
  }

  return true;
};
