import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { AlertCircle, Upload, Download, ChevronDown, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

export default function ComputerImport() {
  const { register, handleSubmit } = useForm();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const downloadTemplate = () => {
    const template = [
      ['asset_tag', 'name', 'type', 'manufacturer', 'model', 'status', 'serial_number', 'location', 'department', 'notes'],
      ['COMP001', 'Dev Laptop 1', 'laptop', 'Dell', 'XPS 15', 'active', 'SN123456', 'Main Office', 'IT', 'Development machine'],
      ['COMP002', 'Reception PC', 'desktop', 'HP', 'ProDesk 600', 'active', 'SN789012', 'Reception', 'Admin', 'Front desk computer'],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(template);

    // Set column widths
    ws['!cols'] = [
      { width: 15 }, // asset_tag
      { width: 20 }, // name
      { width: 12 }, // type
      { width: 15 }, // manufacturer
      { width: 15 }, // model
      { width: 12 }, // status
      { width: 15 }, // serial_number
      { width: 15 }, // location
      { width: 15 }, // department
      { width: 30 }, // notes
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Computers Template');
    XLSX.writeFile(wb, 'computer_import_template.xlsx');
  };

  const validateType = (type: string) => {
    return ['desktop', 'laptop', 'workstation', 'server'].includes(type.toLowerCase());
  };

  const validateStatus = (status: string) => {
    return ['active', 'maintenance', 'retired', 'storage'].includes(status.toLowerCase());
  };

  const onSubmit = async (data: { file: FileList }) => {
    try {
      setImporting(true);
      setResult(null);
      const file = data.file[0];
      
      const result: ImportResult = {
        total: 0,
        successful: 0,
        failed: 0,
        errors: [],
      };

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workbook = XLSX.read(e.target?.result, { type: 'binary' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

          result.total = rows.length;

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            // Validate required fields
            if (!row.asset_tag || !row.name || !row.type || !row.manufacturer || !row.model) {
              result.failed++;
              result.errors.push(`Row ${i + 2}: Missing required fields`);
              continue;
            }

            // Validate type
            if (!validateType(row.type)) {
              result.failed++;
              result.errors.push(`Row ${i + 2}: Invalid type - ${row.type}`);
              continue;
            }

            // Validate status
            if (row.status && !validateStatus(row.status)) {
              result.failed++;
              result.errors.push(`Row ${i + 2}: Invalid status - ${row.status}`);
              continue;
            }

            try {
              // Check if computer with asset tag already exists
              const { data: existingComputers, error: checkError } = await supabase
                .from('computer_assets')
                .select('id')
                .eq('asset_tag', row.asset_tag);

              if (checkError) throw checkError;

              if (existingComputers && existingComputers.length > 0) {
                result.failed++;
                result.errors.push(`Row ${i + 2}: Computer with asset tag ${row.asset_tag} already exists`);
                continue;
              }

              // Insert new computer
              const { error: insertError } = await supabase
                .from('computer_assets')
                .insert([{
                  asset_tag: row.asset_tag,
                  name: row.name,
                  type: row.type.toLowerCase(),
                  manufacturer: row.manufacturer,
                  model: row.model,
                  status: row.status?.toLowerCase() || 'active',
                  serial_number: row.serial_number,
                  location: row.location,
                  department: row.department,
                  notes: row.notes,
                }]);

              if (insertError) throw insertError;

              result.successful++;
            } catch (error: any) {
              result.failed++;
              result.errors.push(`Row ${i + 2}: ${error.message || 'Unknown error'}`);
            }
          }

          setResult(result);
        } catch (error: any) {
          setResult({
            total: 0,
            successful: 0,
            failed: 1,
            errors: ['Failed to parse Excel file. Please make sure you are using the correct template.'],
          });
        }
      };

      reader.onerror = () => {
        setResult({
          total: 0,
          successful: 0,
          failed: 1,
          errors: ['Failed to read the file. Please try again.'],
        });
      };

      reader.readAsBinaryString(file);
    } catch (error: any) {
      setResult({
        total: 0,
        successful: 0,
        failed: 1,
        errors: [error.message || 'An unexpected error occurred'],
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left border-b border-gray-200 focus:outline-none"
      >
        <div className="flex items-center space-x-2">
          <Upload className="w-5 h-5 text-gray-500" />
          <span className="text-lg font-medium text-gray-900">Import Computers</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div className="max-w-xl">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Instructions</h3>
              <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                <li>Download and fill out the template file</li>
                <li>Valid types: desktop, laptop, workstation, server</li>
                <li>Valid statuses: active, maintenance, retired, storage</li>
                <li>Asset tags must be unique</li>
                <li>Required fields: asset_tag, name, type, manufacturer, model</li>
              </ul>
            </div>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Template
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <input
                type="file"
                accept=".xlsx,.xls"
                {...register('file', { required: true })}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={importing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Computers
                  </>
                )}
              </button>
            </div>
          </form>

          {result && (
            <div className={`rounded-md p-4 ${
              result.failed > 0 ? 'bg-yellow-50' : 'bg-green-50'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className={`h-5 w-5 ${
                    result.failed > 0 ? 'text-yellow-400' : 'text-green-400'
                  }`} />
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    result.failed > 0 ? 'text-yellow-800' : 'text-green-800'
                  }`}>
                    Import Results
                  </h3>
                  <div className="mt-2 text-sm">
                    <p className={result.failed > 0 ? 'text-yellow-700' : 'text-green-700'}>
                      Total processed: {result.total}<br />
                      Successfully imported: {result.successful}<br />
                      Failed: {result.failed}
                    </p>
                    {result.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium text-yellow-800">Errors:</p>
                        <ul className="list-disc list-inside text-yellow-700">
                          {result.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}