import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FileText, Download, CheckCircle2, Clock, Award, Shield } from 'lucide-react';

export const ReportsAnalyticsPage: React.FC = () => {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExperiments = async () => {
    try {
      const res = await api.get('/reports/experiments');
      setExperiments(res.data);
    } catch (err) {
      console.error('Failed to load experiments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const handleDownloadPdf = async (expId: number) => {
    try {
      const response = await api.get(`/reports/experiments/${expId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MTech_Research_Evaluation_Report_EXP_${expId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert('Failed to download PDF report');
    }
  };

  const handleDownloadCsv = async (expId: number) => {
    try {
      const response = await api.get(`/reports/experiments/${expId}/csv`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `experiment_metrics_comparison_${expId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert('Failed to download CSV report');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Research Evaluation Reports & Experiment Suite
          </h2>
          <p className="text-xs text-slate-400">
            Downloadable publication-grade PDF and CSV evaluation deliverables for M.Tech dissertation submission
          </p>
        </div>

        {experiments.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDownloadPdf(experiments[0].id)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Official Research PDF</span>
            </button>
            <button
              onClick={() => handleDownloadCsv(experiments[0].id)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 transition border border-slate-700"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Metrics</span>
            </button>
          </div>
        )}
      </div>

      {/* Academic Citation Block */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-blue-400">
          <Award className="w-4 h-4" />
          <span>PROJECT SYNOPSIS & ACADEMIC CREDITS</span>
        </div>
        <h3 className="text-base font-bold text-white font-sans">
          “AN INTELLIGENT CAMPUS SECURITY SYSTEM FOR CYBERSECURITY APPLICATIONS”
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs font-mono text-slate-300">
          <div><span className="text-slate-500 block">Candidate:</span> Nalina G (25CSE09)</div>
          <div><span className="text-slate-500 block">Supervisor:</span> Dr. Nirmala G, Assoc. Prof.</div>
          <div><span className="text-slate-500 block">Department:</span> Computer Science & Eng.</div>
          <div><span className="text-slate-500 block">Institution:</span> SSIT Tumakuru / SSAHE</div>
        </div>
      </div>

      {/* Experiment Runs Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Documented Research Experiments (EXP-01 to EXP-10)</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Experiment Title</th>
                <th className="py-3 px-4">Target Algorithm / Module</th>
                <th className="py-3 px-4">Dataset Evaluated</th>
                <th className="py-3 px-4">Execution Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {experiments.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-900/60 transition">
                  <td className="py-3 px-4 font-bold text-blue-400">{exp.experiment_code}</td>
                  <td className="py-3 px-4 text-white font-sans font-medium">{exp.title}</td>
                  <td className="py-3 px-4 text-slate-300">{exp.algorithm}</td>
                  <td className="py-3 px-4 text-slate-400">{exp.dataset_name}</td>
                  <td className="py-3 px-4 text-amber-400">{exp.execution_time_sec}s</td>
                  <td className="py-3 px-4">
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                      {exp.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleDownloadPdf(exp.id)}
                      className="text-blue-400 hover:text-blue-300 p-1 rounded"
                      title="Download PDF"
                    >
                      PDF
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      onClick={() => handleDownloadCsv(exp.id)}
                      className="text-slate-400 hover:text-white p-1 rounded"
                      title="Download CSV"
                    >
                      CSV
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
