import React, { useState } from 'react';
import api from '../services/api';
import { Cpu, Upload, AlertTriangle, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';

export const NetworkIntrusionDetectionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [formData, setFormData] = useState<any>({
    source_ip: '198.51.100.88',
    destination_ip: '10.10.1.10',
    dur: 0.002,
    proto: 'tcp',
    service: 'http',
    spkts: 240,
    dpkts: 2,
    sbytes: 12000,
    dbytes: 80,
    rate: 121000.0,
    sttl: 64,
    dttl: 0,
    sload: 48000000.0,
    dload: 320000.0,
    sloss: 80,
    dloss: 0,
    sjit: 0.1,
    djit: 0.0,
    swin: 0,
    dwin: 0,
    tcprtt: 0.45,
    synack: 0.40,
    ackdat: 0.0,
    smean: 50.0,
    dmean: 40.0,
    ct_srv_src: 55,
    ct_state_ttl: 2,
    ct_dst_ltm: 48,
    ct_src_dport_ltm: 42,
    ct_dst_sport_ltm: 1,
    ct_dst_src_ltm: 52
  });

  const [loading, setLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<any | null>(null);

  // Batch states
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchResult, setBatchResult] = useState<any | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleAnalyzeSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/detection/analyze', formData);
      setSingleResult(res.data);
    } catch (err: any) {
      alert(`Inference failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchFile) {
      alert('Please select a CSV file first');
      return;
    }
    setBatchLoading(true);
    try {
      const form = new FormData();
      form.append('file', batchFile);
      const res = await api.post('/detection/analyze-batch', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBatchResult(res.data);
    } catch (err: any) {
      alert(`Batch analysis failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-400" />
          Network Intrusion Detection Engine
        </h2>
        <p className="text-xs text-slate-400">
          Feed packet flow feature vectors into trained ML models for line-rate inference, classification, and risk scoring
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('single')}
          className={`pb-3 transition ${
            activeTab === 'single' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'
          }`}
        >
          Single Record Analysis
        </button>
        <button
          onClick={() => setActiveTab('batch')}
          className={`pb-3 transition ${
            activeTab === 'batch' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'
          }`}
        >
          Batch CSV Traffic Ingestion
        </button>
      </div>

      {activeTab === 'single' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Input Network Flow Record</h3>
            <form onSubmit={handleAnalyzeSingle} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400">Source IP</label>
                  <input
                    type="text"
                    value={formData.source_ip}
                    onChange={(e) => handleInputChange('source_ip', e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Destination IP</label>
                  <input
                    type="text"
                    value={formData.destination_ip}
                    onChange={(e) => handleInputChange('destination_ip', e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Protocol</label>
                  <select
                    value={formData.proto}
                    onChange={(e) => handleInputChange('proto', e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  >
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                    <option value="icmp">ICMP</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400">Service</label>
                  <input
                    type="text"
                    value={formData.service}
                    onChange={(e) => handleInputChange('service', e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Duration (dur)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.dur}
                    onChange={(e) => handleInputChange('dur', parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Rate (pkts/s)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.rate}
                    onChange={(e) => handleInputChange('rate', parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400">Source Packets (spkts)</label>
                  <input
                    type="number"
                    value={formData.spkts}
                    onChange={(e) => handleInputChange('spkts', parseInt(e.target.value) || 0)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Dest Packets (dpkts)</label>
                  <input
                    type="number"
                    value={formData.dpkts}
                    onChange={(e) => handleInputChange('dpkts', parseInt(e.target.value) || 0)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Source Bytes (sbytes)</label>
                  <input
                    type="number"
                    value={formData.sbytes}
                    onChange={(e) => handleInputChange('sbytes', parseInt(e.target.value) || 0)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400">TCP RTT (tcprtt)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.tcprtt}
                    onChange={(e) => handleInputChange('tcprtt', parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400">ct_srv_src</label>
                  <input
                    type="number"
                    value={formData.ct_srv_src}
                    onChange={(e) => handleInputChange('ct_srv_src', parseInt(e.target.value) || 0)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400">ct_dst_src_ltm</label>
                  <input
                    type="number"
                    value={formData.ct_dst_src_ltm}
                    onChange={(e) => handleInputChange('ct_dst_src_ltm', parseInt(e.target.value) || 0)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-sans text-xs font-semibold px-5 py-2 rounded-lg transition"
                >
                  {loading ? 'Evaluating Model...' : 'Run IDS Prediction'}
                </button>
              </div>
            </form>
          </div>

          {/* Results Panel */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Detection Outcome</h3>
              {singleResult ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border text-center ${
                    singleResult.predicted_class === 'Normal' ?
                    'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    <span className="text-xs uppercase tracking-wider font-mono">Predicted Activity</span>
                    <h4 className="text-2xl font-bold mt-1">{singleResult.predicted_class}</h4>
                    <span className="text-xs font-mono">Confidence: {(singleResult.confidence * 100).toFixed(1)}%</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-400">Risk Score:</span>
                      <p className="text-sm font-bold text-white mt-0.5">{singleResult.risk_score} / 100</p>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-400">Severity:</span>
                      <p className={`text-sm font-bold mt-0.5 ${
                        singleResult.severity === 'CRITICAL' ? 'text-rose-400' :
                        singleResult.severity === 'HIGH' ? 'text-amber-400' : 'text-blue-400'
                      }`}>
                        {singleResult.severity}
                      </p>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-400">Inference Latency:</span>
                      <p className="text-sm font-bold text-white mt-0.5">{singleResult.detection_latency_ms} ms</p>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-400">Alert Spawned:</span>
                      <p className="text-sm font-bold text-white mt-0.5">{singleResult.alert_generated ? 'YES' : 'NO'}</p>
                    </div>
                  </div>

                  <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800 text-xs">
                    <span className="text-slate-400 font-semibold block mb-1">Risk Logic Explanation:</span>
                    <p className="text-slate-300 leading-relaxed">{singleResult.explanation}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500 text-xs">
                  <ShieldCheck className="w-12 h-12 mx-auto text-slate-700 mb-2" />
                  Enter packet flow telemetry and click "Run IDS Prediction"
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Batch Tab */
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-6">
          <form onSubmit={handleBatchAnalyze} className="max-w-xl mx-auto text-center space-y-4">
            <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-8 transition cursor-pointer">
              <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3" />
              <p className="text-sm font-medium text-slate-200">Upload Campus Traffic Capture (.CSV)</p>
              <p className="text-xs text-slate-500 mt-1">Conforms to UNSW-NB15 / CIC-IDS2017 flow feature schema</p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setBatchFile(e.target.files ? e.target.files[0] : null)}
                className="mt-4 text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />
            </div>
            <button
              type="submit"
              disabled={batchLoading || !batchFile}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-6 py-2.5 rounded-lg transition"
            >
              {batchLoading ? 'Processing Batch Stream...' : 'Analyze Captured Traffic'}
            </button>
          </form>

          {batchResult && (
            <div className="space-y-4 pt-6 border-t border-slate-800">
              <h3 className="text-sm font-semibold text-white">Batch Analysis Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-slate-400">Total Records:</span>
                  <p className="text-lg font-bold text-white mt-1">{batchResult.total_records}</p>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-emerald-400">Normal Flows:</span>
                  <p className="text-lg font-bold text-emerald-400 mt-1">{batchResult.normal_count}</p>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-rose-400">Threats Flagged:</span>
                  <p className="text-lg font-bold text-rose-400 mt-1">{batchResult.malicious_count}</p>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-blue-400">Avg Latency:</span>
                  <p className="text-lg font-bold text-blue-400 mt-1">{batchResult.avg_latency_ms} ms</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
