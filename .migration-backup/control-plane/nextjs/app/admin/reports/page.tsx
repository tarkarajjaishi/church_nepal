'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Define types for our report configurations
type Dataset = 'churches' | 'revenue' | 'audit';
type Column = string;
type Filter = {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string;
};

const DATASET_COLUMNS: Record<Dataset, Column[]> = {
  churches: ['id', 'name', 'email', 'created_at', 'plan', 'status'],
  revenue: ['date', 'amount', 'currency', 'method', 'status'],
  audit: ['timestamp', 'action', 'resource_type', 'resource_id', 'user_id']
};

export default function ReportsPage() {
  const [dataset, setDataset] = useState<Dataset>('churches');
  const [selectedColumns, setSelectedColumns] = useState<Column[]>([]);
  const [filters, setFilters] = useState<Filter[]>([{ field: '', operator: 'equals', value: '' }]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [reportPresets, setReportPresets] = useState<any[]>([]);
  const [presetName, setPresetName] = useState('');

  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('reportPresets');
    if (saved) {
      try {
        setReportPresets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse report presets', e);
      }
    }
  }, []);

  // Update columns when dataset changes
  useEffect(() => {
    setSelectedColumns(DATASET_COLUMNS[dataset]);
  }, [dataset]);

  const handleAddFilter = () => {
    setFilters([...filters, { field: '', operator: 'equals', value: '' }]);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);
  };

  const handleFilterChange = (index: number, field: keyof Filter, value: any) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setFilters(newFilters);
  };

  const toggleColumn = (col: Column) => {
    if (selectedColumns.includes(col)) {
      setSelectedColumns(selectedColumns.filter(c => c !== col));
    } else {
      setSelectedColumns([...selectedColumns, col]);
    }
  };

  const generatePreview = () => {
    // Mock data generation based on selected options
    const mockData = Array.from({ length: 5 }, (_, i) => {
      const item: any = {};
      selectedColumns.forEach(col => {
        if (col === 'id') item[col] = `ID${i + 1}`;
        else if (col === 'name') item[col] = `Church ${i + 1}`;
        else if (col === 'email') item[col] = `contact${i + 1}@example.com`;
        else if (col === 'created_at') item[col] = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
        else if (col === 'plan') item[col] = ['Basic', 'Pro', 'Enterprise'][i % 3];
        else if (col === 'status') item[col] = ['Active', 'Suspended'][i % 2];
        else if (col === 'date') item[col] = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
        else if (col === 'amount') item[col] = `$${(Math.random() * 1000).toFixed(2)}`;
        else if (col === 'currency') item[col] = ['USD', 'EUR'][i % 2];
        else if (col === 'method') item[col] = ['Stripe', 'PayPal'][i % 2];
        else if (col === 'timestamp') item[col] = new Date(Date.now() - i * 3600000).toISOString();
        else if (col === 'action') item[col] = ['CREATE', 'UPDATE', 'DELETE'][i % 3];
        else if (col === 'resource_type') item[col] = ['Church', 'User', 'Event'][i % 3];
        else item[col] = `Value ${i + 1}-${col}`;
      });
      return item;
    });

    setPreviewData(mockData);
  };

  const exportData = (format: 'csv' | 'json') => {
    if (previewData.length === 0) return;

    let content = '';
    if (format === 'csv') {
      const headers = selectedColumns.join(',');
      const rows = previewData.map(row =>
        selectedColumns.map(col => `"${row[col] || ''}"`).join(',')
      );
      content = [headers, ...rows].join('\n');
    } else {
      content = JSON.stringify(previewData, null, 2);
    }

    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const savePreset = () => {
    if (!presetName.trim()) return;

    const newPreset = {
      id: Date.now(),
      name: presetName,
      dataset,
      columns: selectedColumns,
      filters,
      dateRange
    };

    const updatedPresets = [...reportPresets, newPreset];
    setReportPresets(updatedPresets);
    localStorage.setItem('reportPresets', JSON.stringify(updatedPresets));
    setPresetName('');
  };

  const loadPreset = (preset: any) => {
    setDataset(preset.dataset);
    setSelectedColumns(preset.columns);
    setFilters(preset.filters);
    setDateRange(preset.dateRange);
  };

  const removePreset = (id: number) => {
    const updatedPresets = reportPresets.filter(p => p.id !== id);
    setReportPresets(updatedPresets);
    localStorage.setItem('reportPresets', JSON.stringify(updatedPresets));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-[var(--text)]">Custom Report Builder</h1>

      {/* Preset Management */}
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h2 className="font-semibold text-[var(--text-strong)]">Saved Presets</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {reportPresets.map((preset) => (
                <div key={preset.id} className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => loadPreset(preset)}>
                    {preset.name}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-[var(--text)] hover:text-red-500"
                    onClick={() => removePreset(preset.id)}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full sm:w-auto flex gap-2">
            <Input
              placeholder="Preset name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="min-w-[150px]"
            />
            <Button onClick={savePreset}>Save Preset</Button>
          </div>
        </div>
      </Card>

      {/* Dataset Selection */}
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-[var(--text-strong)] mb-3">Select Dataset</h2>
        <div className="flex flex-wrap gap-3">
          {(['churches', 'revenue', 'audit'] as Dataset[]).map((ds) => (
            <Button
              key={ds}
              variant={dataset === ds ? 'default' : 'outline'}
              onClick={() => setDataset(ds)}
            >
              {ds.charAt(0).toUpperCase() + ds.slice(1)}
            </Button>
          ))}
        </div>
      </Card>

      {/* Columns Selection */}
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-[var(--text-strong)] mb-3">Select Columns</h2>
        <div className="flex flex-wrap gap-2">
          {DATASET_COLUMNS[dataset].map((col) => (
            <Badge
              key={col}
              variant={selectedColumns.includes(col) ? 'default' : 'outline'}
              className={`cursor-pointer ${selectedColumns.includes(col) ? 'bg-[var(--accent)] text-white' : ''}`}
              onClick={() => toggleColumn(col)}
            >
              {col}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Filters & Date Range */}
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-[var(--text-strong)] mb-3">Filters</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Date Range</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-3">
          {filters.map((filter, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">Field</label>
                <select
                  value={filter.field}
                  onChange={(e) => handleFilterChange(index, 'field', e.target.value)}
                  className="w-full p-2 border border-[var(--border)] rounded bg-[var(--panel)] text-[var(--text)]"
                >
                  <option value="">Select field</option>
                  {DATASET_COLUMNS[dataset].map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">Operator</label>
                <select
                  value={filter.operator}
                  onChange={(e) => handleFilterChange(index, 'operator', e.target.value as any)}
                  className="w-full p-2 border border-[var(--border)] rounded bg-[var(--panel)] text-[var(--text)]"
                >
                  <option value="equals">Equals</option>
                  <option value="contains">Contains</option>
                  <option value="gt">Greater Than</option>
                  <option value="lt">Less Than</option>
                  <option value="gte">Greater or Equal</option>
                  <option value="lte">Less or Equal</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">Value</label>
                <Input
                  value={filter.value}
                  onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
                  placeholder="Enter value"
                />
              </div>
              
              <div>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => handleRemoveFilter(index)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          
          <Button variant="outline" onClick={handleAddFilter}>
            Add Filter
          </Button>
        </div>
      </Card>

      {/* Preview & Export */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/2">
          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-[var(--text-strong)]">Preview</h2>
              <Button onClick={generatePreview}>Generate Preview</Button>
            </div>
            
            {previewData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--border)]">
                  <thead>
                    <tr>
                      {selectedColumns.map(col => (
                        <th key={col} className="px-3 py-2 text-left text-xs font-medium text-[var(--text)] uppercase tracking-wider">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {previewData.map((row, idx) => (
                      <tr key={idx}>
                        {selectedColumns.map(col => (
                          <td key={col} className="px-3 py-2 whitespace-nowrap text-sm text-[var(--text)]">
                            {String(row[col] || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[var(--muted)] italic">No preview data. Click "Generate Preview" after configuring your report.</p>
            )}
          </Card>
        </div>

        <div className="lg:w-1/2">
          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 h-full">
            <h2 className="font-semibold text-[var(--text-strong)] mb-3">Export Options</h2>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => exportData('csv')}
                disabled={previewData.length === 0}
              >
                Export as CSV
              </Button>
              
              <Button 
                onClick={() => exportData('json')}
                disabled={previewData.length === 0}
              >
                Export as JSON
              </Button>
              
              <Button 
                variant="secondary"
                onClick={() => alert('Scheduled report feature would trigger here')}
                disabled={previewData.length === 0}
              >
                Schedule Report
              </Button>
            </div>
            
            <div className="mt-6 p-4 bg-[var(--panel-2)] rounded-lg">
              <h3 className="font-medium text-[var(--text-strong)] mb-2">Report Summary</h3>
              <ul className="text-sm text-[var(--muted)] space-y-1">
                <li>Dataset: <span className="text-[var(--text)]">{dataset}</span></li>
                <li>Columns: <span className="text-[var(--text)]">{selectedColumns.length}</span></li>
                <li>Filters: <span className="text-[var(--text)]">{filters.filter(f => f.field && f.value).length}</span></li>
                <li>Date Range: <span className="text-[var(--text)]">{dateRange.start || 'None'} to {dateRange.end || 'None'}</span></li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
