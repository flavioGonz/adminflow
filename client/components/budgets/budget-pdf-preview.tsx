"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Budget } from "@/types/budget";
import { BudgetItem } from "@/types/budget-item";
import { BudgetSection } from "@/types/budget-section";

interface BudgetPdfPreviewProps {
  budget: Budget;
  items: BudgetItem[];
  sections: BudgetSection[];
  autoGenerate?: boolean;
  coverFileData?: ArrayBuffer | null;
  headerTitle?: string;
  headerClientName?: string;
  headerStatus?: string;
}

export const BudgetPdfPreview = forwardRef<
  { generate: () => Promise<Blob | null> },
  BudgetPdfPreviewProps
>(function BudgetPdfPreview(
  {
    budget,
    items,
    sections,
    autoGenerate = false,
    coverFileData = null,
    headerTitle,
    headerClientName,
    headerStatus,
  },
  ref
) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  const generatePdf = useCallback(async () => {
    try {
    const doc = new jsPDF({ format: "a4" });

    const formatDate = (value?: string): string => {
      if (!value) return "Fecha pendiente";
      try {
        return new Intl.DateTimeFormat("es-ES", {
          year: "numeric",
          month: "long",
          day: "2-digit",
        }).format(new Date(value));
      } catch {
        return value;
      }
    };

    const htmlToText = (value?: string) => {
      if (!value) return "";
      if (typeof DOMParser === "undefined") {
        return value.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?[^>]+>/g, "").trim();
      }
      const parser = new DOMParser();
      const docNode = parser.parseFromString(value, "text/html");
      const blockTags = new Set(["div", "p", "h1", "h2", "h3", "h4", "li"]);
      const walk = (node: ChildNode): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent ?? "";
        }
        let text = "";
        node.childNodes.forEach((child) => {
          text += walk(child);
        });
        const tagName = (node as Element).nodeName?.toLowerCase();
        if (tagName === "br") text += "\n";
        if (tagName && blockTags.has(tagName)) text += "\n";
        return text;
      };
      return walk(docNode.body).replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").trim();
    };

  const addPlainCoverPage = () => {
    doc.setFillColor("#ffffff");
    doc.rect(0, 0, 210, 297, "F");
    doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.setTextColor("#030712");
        const rightEdge = 210 - 20;
        const startY = 60;
        doc.text(headerTitle || "Presupuesto Ejecutivo", rightEdge, startY, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(13);
        doc.text(`Cliente: ${headerClientName || "Cliente"}`, rightEdge, startY - 20, { align: "right" });
        doc.text(`Estado: ${headerStatus || "Nuevo"}`, rightEdge, startY - 35, { align: "right" });
        doc.setFontSize(11);
    doc.setFontSize(10);
    const numberText = `Presupuesto #${budget.id}`;
    const dateText = `Fecha: ${formatDate(budget.createdAt)}`;
    doc.text(numberText, rightEdge, startY - 65, { align: "right" });
    doc.text(dateText, rightEdge, startY - 75, { align: "right" });
    doc.addPage();
  };

      if (!coverFileData) {
        addPlainCoverPage();
      }


      const renderSectionPage = (section: BudgetSection) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor("#0f172a");
        doc.text(section.title, 20, 35);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor("#0f172a");
        const sectionContent = htmlToText(section.content);
        const sectionLines = doc.splitTextToSize(sectionContent, 170);
        doc.text(sectionLines, 20, 50);
      };

      if (sections.length > 0) {
        renderSectionPage(sections[0]);
      }


      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor("#0f172a");
      doc.text("Cuadro de Precios", 20, 28);
      autoTable(doc, {
        startY: 35,
        head: [["#", "Item", "Descripción", "P. Unit.", "Total + IVA"]],
        body: items.map((item, index) => {
          const total = item.total ?? item.quantity * item.unitPrice;
          const totalWithTax = total * 1.22;
          return [
            index + 1,
            item.productName || item.description,
            item.description,
            `$${item.unitPrice.toFixed(2)}`,
            `$${totalWithTax.toFixed(2)}`,
          ];
        }),
        foot: [
          [
            { content: "Total", colSpan: 4, styles: { halign: "right" } },
            {
              content: `$${items.reduce((sum, item) => {
                const total = item.total ?? item.quantity * item.unitPrice;
                return sum + total * 1.22;
              }, 0).toFixed(2)}`,
            },
          ],
        ],
        styles: { font: "helvetica", fontSize: 10 },
        headStyles: { fillColor: "#0f172a", textColor: "#fff" },
        footStyles: { fillColor: "#ffffff", textColor: "#0f172a", fontStyle: "bold" },
      });

      for (const section of sections.slice(1)) {
        doc.addPage();
        renderSectionPage(section);
      }
      const docBytes = await doc.output("arraybuffer");
      const generatedDoc = await PDFDocument.load(docBytes);
      let finalDoc = generatedDoc;
      let coverPagesCount = 0;

      if (coverFileData) {
        const coverDoc = await PDFDocument.load(coverFileData).catch(() => null);
        if (coverDoc) {
          const firstPage = coverDoc.getPage(0);
          const pageWidth = firstPage.getWidth();
          const pageHeight = firstPage.getHeight();
          const boldFont = await coverDoc.embedFont(StandardFonts.HelveticaBold);
          const regularFont = await coverDoc.embedFont(StandardFonts.Helvetica);
          const textColor = rgb(0, 0, 0);
          const baseY = pageHeight / 2 + 120;
          const rightX = pageWidth - 40;
          const drawRightText = (text: string, yOffset: number, fontSize: number, font: any) => {
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            const leftLimit = 40;
            const xPos = Math.max(leftLimit, rightX - textWidth);
            firstPage.drawText(text, {
              x: xPos,
              y: baseY + yOffset,
              size: fontSize,
              font,
              color: textColor,
              rotate: undefined,
            });
          };
          drawRightText(headerTitle || "Presupuesto Ejecutivo", 0, 24, boldFont);
          drawRightText(`Cliente: ${headerClientName || "Cliente"}`, -28, 12, regularFont);
          drawRightText(`Presupuesto #${budget.id}`, -48, 9, regularFont);
          drawRightText(`Fecha: ${formatDate(budget.createdAt)}`, -64, 9, regularFont);
          const mergedDoc = await PDFDocument.create();
          const coverPages = await mergedDoc.copyPages(coverDoc, coverDoc.getPageIndices());
          coverPages.forEach((page) => mergedDoc.addPage(page));
          const generatedPages = await mergedDoc.copyPages(generatedDoc, generatedDoc.getPageIndices());
          generatedPages.forEach((page) => mergedDoc.addPage(page));
          finalDoc = mergedDoc;
          coverPagesCount = coverPages.length;
        }
      }

      const numberingPages = finalDoc.getPageCount() - coverPagesCount;
      if (numberingPages > 0) {
        const font = await finalDoc.embedFont(StandardFonts.Helvetica);
        const color = rgb(55 / 255, 65 / 255, 99 / 255);
        for (let pageIndex = coverPagesCount; pageIndex < finalDoc.getPageCount(); pageIndex += 1) {
          const pageNumber = pageIndex - coverPagesCount + 1;
          const page = finalDoc.getPage(pageIndex);
        page.drawText(`PÃ¡gina ${pageNumber} / ${numberingPages}`, {
            x: 150,
            y: 10,
            size: 9,
            font,
            color,
          });
        }
      }

      const finalBytes = await finalDoc.save();
      const pdfArray = new Uint8Array(finalBytes);
      const blob = new Blob([pdfArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
      prevUrlRef.current = url;
      setPdfUrl(url);
      return blob;
    } catch (error) {
      console.error("Error generando PDF:", error);
      return null;
    }
  }, [budget, coverFileData, headerClientName, headerStatus, headerTitle, items, sections]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (autoGenerate) {
      void generatePdf();
    }
  }, [autoGenerate, generatePdf]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useImperativeHandle(ref, () => ({
    generate: async () => {
      return await generatePdf();
    },
  }));

  return (
    <div className="space-y-4">
      {pdfUrl && (
        <div className="border rounded-md bg-white/80">
          <iframe src={pdfUrl} width="100%" height="600px" title="Vista PDF" />
        </div>
      )}
    </div>
  );
});
