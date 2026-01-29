"use client";

import { ChangeEvent, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CreateAccessDTO, createAccess } from "@/lib/api-access";
import { ACCESS_TYPES } from "./icon-map";
import { FileSpreadsheet } from "lucide-react";

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

const HEADERALIAS_MAP: Record<string, string[]> = {
  equipo: ["equipo", "nombre", "name", "dispositivo", "device"],
  tipo_equipo: ["tipo", "tipoequipo", "tipo_de_equipo", "tipo_equipo", "type", "categoria"],
  ip: ["ip", "ipurl", "ip/url", "url", "host"],
  user: ["usuario", "user", "login"],
  pass: ["contraseña", "contrasena", "password", "pass", "clave"],
  serieMac: ["seriemac", "serie", "mac", "serie_mac"],
  comentarios: ["comentarios", "comentario", "notas", "observaciones", "nota"],
};

type RawRow = Record<string, string | number | null | undefined>;

type ImportSummary = {
  total: number;
  imported: number;
  failed: number;
};

const mapRowToAccess = (row: RawRow): CreateAccessDTO | null => {
  const normalizedRow: Record<string, string> = {};
  Object.entries(row).forEach(([key, value]) => {
    const normalizedKey = normalizeKey(key);
    if (!normalizedKey) return;
    normalizedRow[normalizedKey] = String(value ?? "").trim();
  });

  const getValue = (aliases: string[]) => {
    for (const alias of aliases) {
      const normalizedAlias = normalizeKey(alias);
      if (!normalizedAlias) continue;
      if (normalizedRow[normalizedAlias]) {
        return normalizedRow[normalizedAlias];
      }
    }
    return "";
  };

  const equipo = getValue(HEADERALIAS_MAP.equipo);
  const tipoRaw = getValue(HEADERALIAS_MAP.tipo_equipo);
  if (!equipo || !tipoRaw) {
    return null;
  }

  const tipoMatched = (() => {
    const normalizedValue = tipoRaw.toLowerCase();
    const found = ACCESS_TYPES.find(
      (type) =>
        type.value.toLowerCase() === normalizedValue ||
        type.label.toLowerCase() === normalizedValue
    );
    return found ? found.value : tipoRaw;
  })();

  return {
    equipo,
    tipo_equipo: tipoMatched,
    ip: getValue(HEADERALIAS_MAP.ip),
    user: getValue(HEADERALIAS_MAP.user),
    pass: getValue(HEADERALIAS_MAP.pass),
    serieMac: getValue(HEADERALIAS_MAP.serieMac),
    comentarios: getValue(HEADERALIAS_MAP.comentarios),
  };
};

interface ImportAccessDialogProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  clientId: string;
  onSuccess: () => void;
}

export function ImportAccessDialog({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: ImportAccessDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsImporting(true);
    setSummary(null);
    setSelectedFile(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        toast.error("El archivo no contiene ninguna hoja.");
        return;
      }

      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "" });
      const entries = rows
        .map(mapRowToAccess)
        .filter((item): item is CreateAccessDTO => Boolean(item));

      if (!entries.length) {
        toast.error("No se encontraron filas válidas. Verifica las columnas.");
        return;
      }

      let imported = 0;
      let failed = 0;

      for (const entry of entries) {
        try {
          await createAccess(clientId, entry);
          imported += 1;
        } catch (error) {
          console.error("Error importando acceso:", error, entry);
          failed += 1;
        }
      }

      setSummary({ total: entries.length, imported, failed });
      toast.success(
        `Importados ${imported} de ${entries.length} registros${
          failed ? ` (${failed} fallaron)` : ""
        }.`
      );
      if (imported > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error procesando importación:", error);
      toast.error("No se pudo procesar el archivo.");
    } finally {
      setIsImporting(false);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Importar accesos</DialogTitle>
          <DialogDescription>
            Carga un archivo Excel o CSV con los campos <strong>Equipo</strong>, <strong>Tipo</strong>,
            <strong> IP/URL</strong>, <strong>Usuario</strong>, <strong>Contraseña</strong>, <strong>Serie/MAC</strong> y
            <strong> Comentarios</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={openFilePicker} disabled={isImporting} className="h-10">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {isImporting ? "Procesando..." : "Seleccionar archivo"}
            </Button>
            {selectedFile && (
              <span className="text-sm font-semibold text-slate-600">{selectedFile}</span>
            )}
          </div>
          <Input
            readOnly
            value="Formato esperado: Equipo, Tipo, IP/URL, Usuario, Contraseña, Serie/MAC, Comentarios"
          />
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Tipos permitidos (usa la etiqueta o el valor en la columna Tipo):
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ACCESS_TYPES.map((type) => (
                <span
                  key={type.value}
                  className="rounded-full border border-slate-200 px-3 py-0.5 text-[11px] uppercase text-slate-500"
                >
                  {type.label}
                </span>
              ))}
            </div>
          </div>
          {summary && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p>Total filas procesadas: {summary.total}</p>
              <p>Importadas: {summary.imported}</p>
              <p>Fallidas: {summary.failed}</p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button
            onClick={openFilePicker}
            disabled={isImporting}
            className="bg-sky-600 text-white hover:bg-sky-700"
          >
            Seleccionar otro archivo
          </Button>
        </DialogFooter>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileSelection}
        />
      </DialogContent>
    </Dialog>
  );
}
