import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface PdfViewerModalProps {
  // Renombrado para mayor claridad: puede ser una URL completa, una URL de blob o una ruta de servidor.
  filePath?: string;
  isOpen?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
}

export function PdfViewerModal({
  filePath,
  isOpen,
  onClose,
  children,
}: PdfViewerModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = typeof isOpen !== "undefined";
  const open = controlled ? Boolean(isOpen) : internalOpen;

  const handleOpenChange = (next: boolean) => {
    if (controlled) {
      if (!next) {
        onClose?.();
      }
      return;
    }
    setInternalOpen(next);
  };

  const pdfUrl = useMemo(() => {
    if (!filePath) return null;
    if (filePath.startsWith("blob:") || filePath.startsWith("http")) {
      return filePath;
    }
    const normalizedPath = filePath.startsWith("/")
      ? filePath
      : `/${filePath}`;
    return `http://localhost:5000${normalizedPath}`;
  }, [filePath]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-4xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>PDF Viewer</DialogTitle>
          <VisuallyHidden.Root>
            <DialogTitle>Visor de PDF</DialogTitle>
          </VisuallyHidden.Root>
        </DialogHeader>

        <div className="flex-grow h-full">
          {pdfUrl ? (
            <iframe src={pdfUrl} width="100%" height="100%" className="border-none">
              Este navegador no soporta PDFs. Por favor, descarga el PDF para verlo.
            </iframe>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay archivo PDF para mostrar.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
