// client/components/clients/import-clients-dialog.tsx
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileUp } from "lucide-react";
import * as XLSX from 'xlsx';
import { API_URL } from "@/lib/http";

interface ImportClientsDialogProps {
  onImportComplete: () => void;
}

export function ImportClientsDialog({ onImportComplete }: ImportClientsDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelPreviewData, setExcelPreviewData] = useState<any[][]>([]);
  const clientFieldMap = {
    name: "Nombre",
    alias: "Alias",
    rut: "RUT",
    email: "Email",
    phone: "Teléfono",
    address: "Dirección",
    contract: "Contrato",
  };

  const buildColumnMapping = () =>
    (Object.keys(clientFieldMap) as (keyof typeof clientFieldMap)[]).reduce(
      (acc, key) => {
        acc[key] = "";
        return acc;
      },
      {} as Record<keyof typeof clientFieldMap, string>
    );

  const [columnMapping, setColumnMapping] = useState<Record<keyof typeof clientFieldMap, string>>(buildColumnMapping());

  const handleColumnMappingChange = (field: keyof typeof clientFieldMap, excelColumn: string) => {
    setColumnMapping((prev) => ({ ...prev, [field]: excelColumn === "__IGNORE__" ? "" : excelColumn }));
  };
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importStats, setImportStats] = useState<{ total: number; imported: number; failed: number } | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImportProgress(0);
      setImportStats(null);
      setError(null);
      setExcelHeaders([]);
      setExcelPreviewData([]);

      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        if (data) {
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (json.length > 0) {
            const headers = json[0] as string[];
            setExcelHeaders(headers);
            setExcelPreviewData(json.slice(1, 6) as any[][]); // Get first 5 rows for preview
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setSelectedFile(null);
      setExcelHeaders([]);
      setExcelPreviewData([]);
    }
  };

    const handleImport = async () => {

      if (!selectedFile) {

        setError("Por favor, selecciona un archivo Excel para importar.");

        return;

      }

  

      if (Object.keys(columnMapping).length === 0 || Object.values(columnMapping).every(val => val === "")) {

        setError("Por favor, mapea al menos una columna antes de importar.");

        return;

      }

  

      setIsImporting(true);

      setImportProgress(0);

      setImportStats(null);

      setError(null);

  

      try {

        const reader = new FileReader();

        reader.onload = async (e) => {

          const data = e.target?.result;

          if (data) {

            const workbook = XLSX.read(data, { type: 'array' });

            const sheetName = workbook.SheetNames[0];

            const worksheet = workbook.Sheets[sheetName];

            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  

            if (json.length === 0) {

              setError("El archivo Excel está vacío.");

              setIsImporting(false);

              return;

            }

  

            const excelFileHeaders = json[0] as string[];

            const excelFileRows = json.slice(1) as any[][];

  

            const clientsToImport = excelFileRows.map(row => {

              const client: Record<string, string> = {};

              for (const field in columnMapping) {

                const excelColumnName = columnMapping[field as keyof typeof clientFieldMap];

                if (excelColumnName) {

                  const columnIndex = excelFileHeaders.indexOf(excelColumnName);

                  if (columnIndex !== -1) {

                    client[field] = String(row[columnIndex] || "");

                  }

                }

              }

              return client;

            });

  

            // Filter out empty clients or clients with no mapped data

                        const validClientsToImport = clientsToImport.filter(client => Object.keys(client).length > 0);

            

                        console.log("Clients to import:", validClientsToImport);

            

                        if (validClientsToImport.length === 0) {

                          setError("No se pudieron extraer clientes válidos con el mapeo proporcionado.");

                          setIsImporting(false);

                          return;

                        }

            

                        setImportProgress(25); // Indicate data processing is done

  

                      // Send processed data to backend

  

                      const response = await fetch(`${API_URL}/clients/import`, {

  

                        method: "POST",

  

                        headers: {

  

                          "Content-Type": "application/json",

  

                        },

  

                        body: JSON.stringify(validClientsToImport),

  

                      });

  

            if (!response.ok) {

              const errorData = await response.json();

              throw new Error(errorData.message || "Error al importar clientes.");

            }

  

            const result = await response.json();

            setImportStats(result.stats);

            setImportProgress(100);

            onImportComplete();

            alert("Importación completada con éxito!");

          }

        };

        reader.readAsArrayBuffer(selectedFile);

  

      } catch (err: any) {

        setError(err.message || "Ocurrió un error durante la importación.");

        setImportProgress(0);

        setImportStats(null);

      } finally {

        setIsImporting(false);

        setSelectedFile(null); // Clear selected file after import attempt

        setExcelHeaders([]);

        setExcelPreviewData([]);

          setColumnMapping(buildColumnMapping());

      }

    };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Importar">
          <FileUp className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Importar Clientes</DialogTitle>
          <DialogDescription>
            Sube un archivo Excel (.xlsx) para importar nuevos clientes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              Archivo
            </Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx, .xls"
              className="col-span-3"
              onChange={handleFileChange}
              disabled={isImporting}
            />
          </div>
          {selectedFile && (
            <p className="text-sm text-gray-500 text-center">
              Archivo seleccionado: {selectedFile.name}
            </p>
          )}

          {excelHeaders.length > 0 && excelPreviewData.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Vista Previa de Datos:</h3>
              <div className="overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {excelHeaders.map((header, index) => (
                        <TableHead key={index}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {excelPreviewData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <TableCell key={cellIndex}>{String(cell)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <h3 className="font-semibold mt-4 mb-2">Mapeo de Columnas:</h3>
              <p className="text-sm text-gray-500 mb-2">Asigna las columnas de tu archivo Excel a los campos de cliente.</p>
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(clientFieldMap).map((field) => (
                  <div key={field} className="flex flex-col gap-1">
                    <Label htmlFor={`map-${field}`}>{clientFieldMap[field as keyof typeof clientFieldMap]}</Label>
                    <Select
                      onValueChange={(value) => handleColumnMappingChange(field as keyof typeof clientFieldMap, value)}
                      value={columnMapping[field as keyof typeof clientFieldMap] || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona columna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__IGNORE__">Ignorar</SelectItem>
                        {excelHeaders.map((header, index) => (
                          <SelectItem key={index} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isImporting && (
            <div className="text-center">
              <p>Importando... {importProgress}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          {importStats && (
            <div className="text-center mt-4">
              <h3 className="font-semibold">Estadísticas de Importación:</h3>
              <p>Total de registros: {importStats.total}</p>
              <p className="text-green-600">Importados con éxito: {importStats.imported}</p>
              <p className="text-red-600">Fallidos: {importStats.failed}</p>
            </div>
          )}
          {error && (
            <p className="text-red-500 text-center mt-2">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleImport} disabled={!selectedFile || isImporting || excelHeaders.length === 0}>
            {isImporting ? "Importando..." : "Iniciar Importación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
