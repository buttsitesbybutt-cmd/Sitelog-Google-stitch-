import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Project, Category, DailyLog } from "@/src/lib/firebase";
import { formatDate } from "@/src/lib/utils";

interface PdfOptions {
  title: string;
  subtitle: string;
  footer: string;
  theme: "Modern Blue" | "Sunshine" | "Noir Gold" | "Classic";
  includeLogs: boolean;
}

export const generateSiteReport = (
  projects: Project[], 
  categories: Category[], 
  logsMap: Record<string, DailyLog[]>, 
  options: PdfOptions
) => {
  const doc = new jsPDF();
  const { title, subtitle, footer, theme, includeLogs } = options;

  const themeColors = {
    "Modern Blue": { primary: [59, 130, 246], secondary: [239, 246, 255] },
    "Sunshine": { primary: [245, 158, 11], secondary: [255, 251, 235] },
    "Noir Gold": { primary: [183, 151, 117], secondary: [24, 24, 27] },
    "Classic": { primary: [31, 41, 55], secondary: [243, 244, 246] },
  };

  const colors = themeColors[theme] || themeColors["Modern Blue"];

  // Header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, 210, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, 20, 33);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 190, 33, { align: "right" });

  let currentY = 50;

  // Group by Category
  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  sortedCategories.forEach((cat) => {
    const catProjects = projects.filter(p => p.categoryId === cat.id);
    if (catProjects.length === 0) return;

    // Check for page overflow
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.rect(15, currentY, 180, 8, "F");
    
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(cat.name, 20, currentY + 6);
    
    currentY += 12;

    autoTable(doc, {
      startY: currentY,
      head: [["Villa", "Plot", "Work Title", "Status", "Progress"]],
      body: catProjects.map(p => [
        p.villaNum,
        p.plotNum,
        p.title,
        p.status,
        `${p.progress}%`
      ]),
      headStyles: { 
        fillColor: colors.primary as any,
        fontSize: 10,
        halign: "center",
        cellPadding: 4
      },
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 20 },
        4: { cellWidth: 25, halign: "center" }
      },
      margin: { left: 15, right: 15 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;

    if (includeLogs) {
      catProjects.forEach(p => {
        const logs = logsMap[p.id] || [];
        if (logs.length > 0) {
          // Check page overflow for logs
          if (currentY > 260) {
            doc.addPage();
            currentY = 20;
          }

          doc.setTextColor(120, 120, 120);
          doc.setFontSize(10);
          doc.text(`Daily Logs: ${p.villaNum}/${p.plotNum} - ${p.title}`, 20, currentY);
          currentY += 5;

          autoTable(doc, {
            startY: currentY,
            head: [["Date", "Work Description", "Workers", "Notes"]],
            body: logs.map(l => [formatDate(l.date), l.description, l.workers || "-", l.notes || "-"]),
            styles: { 
              fontSize: 8, 
              textColor: [50, 50, 50],
              cellPadding: 2 
            },
            headStyles: { 
              fillColor: [245, 245, 245], 
              textColor: [0, 0, 0],
              fontSize: 9
            },
            columnStyles: {
              0: { cellWidth: 25 },
              2: { cellWidth: 15, halign: "center" }
            },
            margin: { left: 20, right: 20 }
          });
          currentY = (doc as any).lastAutoTable.finalY + 10;
        }
      });
    }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(footer, 105, 290, { align: "center" });
    doc.text(`Page ${i} of ${pageCount}`, 200, 290, { align: "right" });
  }

  doc.save(`${title.replace(/\s/g, "_")}_${new Date().toISOString().split('T')[0]}.pdf`);
};
