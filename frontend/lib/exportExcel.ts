import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string, sheetName: string = "Reporte") => {
  // 1. Crear el libro y la hoja
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  // 2. Unir la hoja al libro
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // 3. Generar el archivo y descargarlo
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};