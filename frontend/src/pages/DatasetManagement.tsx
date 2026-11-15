import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Dataset } from '../types';
import { Database, Upload, Trash2, CheckCircle2, AlertCircle, FileText, BarChart3 } from 'lucide-react';

export const DatasetManagementPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [validationData, setValidationData] = useState<any | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [targetColumn, setTargetColumn] = useState<string>('attack_cat');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDatasets = async () => {
    try {
      const res = await api.get('/datasets');
      setDatasets(res.data);
      if (res.data.length > 0 && !selectedDataset) {
        setSelectedDataset(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load datasets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  useEffect(() => {
    if (selectedDataset) {
      api.get(`/datasets/${selectedDataset.id}/validation`).then((res) => {
        setValidationData(res.data);
      }).catch(console.error);
    }
  }, [selectedDataset]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !datasetName) {
      alert('Please provide dataset file and name');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', uploadFile);
      form.append('name', datasetName);
      form.append('description', description);
      form.append('target_column', targetColumn);

      const res = await api.post('/datasets/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`Dataset uploaded and validated successfully: ${res.data.name}`);
      setDatasetName('');
      setDescription('');
      setUploadFile(null);
      fetchDatasets();
    } catch (err: any) {
      alert(`Upload failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this dataset?')) return;
    try {
      await api.delete(`/datasets/${id}`);
      setSelectedDataset(null);
      fetchDatasets();
    } catch (err: any) {
      alert(`Delete failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            Cybersecurity Dataset Management & Validation
          </h2>
          <p className="text-xs text-slate-400">
            Upload, inspect, preprocess, and validate benchmark datasets conforming to UNSW-NB15 & CIC-IDS2017
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dataset List & Upload Form */}
        <div className="space-y-6">
          {/* Upload Card */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-400" />
              Upload New CSV Dataset
            </h3>
            <form onSubmit={handleUpload} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-400">Dataset Identifier Name</label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="e.g. Campus_IDS_Fall2026"
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400">Target Label Column</label>
                <input
                  type="text"
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  placeholder="e.g. attack_cat or label"
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400">CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full mt-1 text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-600 file:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-sans text-xs font-semibold py-2 rounded-lg transition mt-2"
              >
                {uploading ? 'Validating CSV...' : 'Upload & Validate'}
              </button>
            </form>
          </div>

          {/* Existing Datasets List */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-white mb-3">Available Datasets ({datasets.length})</h3>
            {datasets.map((ds) => (
              <div
                key={ds.id}
                onClick={() => setSelectedDataset(ds)}
                className={`p-3 rounded-lg border cursor-pointer transition text-xs ${
                  selectedDataset?.id === ds.id ?
                  'bg-blue-600/10 border-blue-500/40 text-blue-300' :
                  'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="font-bold text-white truncate max-w-[150px]">{ds.name}</span>
                  {ds.is_benchmark && (
                    <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      BENCHMARK
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-2">
                  <span>{ds.row_count.toLocaleString()} rows</span>
                  <span>{ds.col_count} features</span>
                  <span>{(ds.file_size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Dataset Details & Validation */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDataset ? (
            <>
              {/* Overview Metrics */}
              <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedDataset.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedDataset.description}</p>
                  </div>
                  {!selectedDataset.is_benchmark && (
                    <button
                      onClick={() => handleDelete(selectedDataset.id)}
                      className="text-rose-400 hover:bg-rose-500/10 p-2 rounded-lg transition"
                      title="Delete Dataset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400">Total Records:</span>
                    <p className="text-sm font-bold text-white mt-1">{selectedDataset.row_count.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400">Feature Count:</span>
                    <p className="text-sm font-bold text-white mt-1">{selectedDataset.col_count}</p>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400">Missing Values:</span>
                    <p className="text-sm font-bold text-emerald-400 mt-1">{selectedDataset.missing_values_count}</p>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400">Duplicates Handled:</span>
                    <p className="text-sm font-bold text-blue-400 mt-1">{selectedDataset.duplicate_rows_count}</p>
                  </div>
                </div>

                {/* Class Distribution Bars */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                    Class Distribution Breakdown
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(selectedDataset.class_distribution || {}).map(([cls, cnt]) => {
                      const pct = ((cnt / selectedDataset.row_count) * 100).toFixed(1);
                      return (
                        <div key={cls} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono text-slate-300">
                            <span>{cls}</span>
                            <span>{cnt.toLocaleString()} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                cls === 'Normal' ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Data Preview */}
              {validationData && (
                <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
                  <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Dataset Records Preview (First 10 Rows)
                  </h4>
                  <div className="overflow-x-auto max-h-60">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0">
                        <tr>
                          {validationData.columns.slice(0, 8).map((col: string) => (
                            <th key={col} className="p-2 truncate">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {validationData.preview_rows.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-900/50">
                            {validationData.columns.slice(0, 8).map((col: string) => (
                              <td key={col} className="p-2 truncate max-w-[120px]">{row[col]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
              Select or upload a dataset to view validation metrics and distributions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
