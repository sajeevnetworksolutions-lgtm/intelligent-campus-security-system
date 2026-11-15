import React, { useState } from 'react';
import api from '../services/api';
import { SHAPExplanation, LIMEExplanation } from '../types';
import { HelpCircle, Play, ShieldAlert, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';

export const ExplainableAIPage: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string>('dos');
  const [loading, setLoading] = useState<boolean>(false);
  const [shapResult, setShapResult] = useState<SHAPExplanation | null>(null);
  const [limeResult, setLimeResult] = useState<LIMEExplanation | null>(null);

  const presets: Record<string, any> = {
    dos: {
      name: 'Denial of Service (SYN Flood)',
      record: {
        dur: 0.002, proto: 'tcp', service: 'http', spkts: 240, dpkts: 2,
        sbytes: 12000, dbytes: 80, rate: 121000.0, sttl: 64, dttl: 0,
        sload: 48000000.0, dload: 320000.0, sloss: 80, dloss: 0, sjit: 0.1,
        djit: 0.0, swin: 0, dwin: 0, tcprtt: 0.45, synack: 0.40, ackdat: 0.0,
        smean: 50.0, dmean: 40.0, ct_srv_src: 55, ct_state_ttl: 2, ct_dst_ltm: 48,
        ct_src_dport_ltm: 42, ct_dst_sport_ltm: 1, ct_dst_src_ltm: 52
      }
    },
    portscan: {
      name: 'Nmap Port Scan (Reconnaissance)',
      record: {
        dur: 0.001, proto: 'tcp', service: '-', spkts: 2, dpkts: 0,
        sbytes: 88, dbytes: 0, rate: 2000.0, sttl: 255, dttl: 0,
        sload: 704000.0, dload: 0.0, sloss: 0, dloss: 0, sjit: 0.0,
        djit: 0.0, swin: 1024, dwin: 0, tcprtt: 0.0, synack: 0.0, ackdat: 0.0,
        smean: 44.0, dmean: 0.0, ct_srv_src: 35, ct_state_ttl: 2, ct_dst_ltm: 35,
        ct_src_dport_ltm: 38, ct_dst_sport_ltm: 1, ct_dst_src_ltm: 35
      }
    },
    normal: {
      name: 'Normal Web Browsing (HTTPS)',
      record: {
        dur: 1.25, proto: 'tcp', service: 'https', spkts: 22, dpkts: 28,
        sbytes: 3500, dbytes: 18200, rate: 40.0, sttl: 64, dttl: 64,
        sload: 22400.0, dload: 116480.0, sloss: 0, dloss: 0, sjit: 1.2,
        djit: 1.1, swin: 255, dwin: 255, tcprtt: 0.025, synack: 0.010, ackdat: 0.015,
        smean: 159.0, dmean: 650.0, ct_srv_src: 2, ct_state_ttl: 0, ct_dst_ltm: 2,
        ct_src_dport_ltm: 2, ct_dst_sport_ltm: 1, ct_dst_src_ltm: 2
      }
    }
  };

  const handleExplain = async () => {
    setLoading(true);
    setShapResult(null);
    setLimeResult(null);
    const sample = presets[selectedPreset].record;
    try {
      const [shapRes, limeRes] = await Promise.all([
        api.post('/explainability/shap', sample),
        api.post('/explainability/lime', sample)
      ]);
      setShapResult(shapRes.data);
      setLimeResult(limeRes.data);
    } catch (err: any) {
      alert(`Explainability generation failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            Explainable Artificial Intelligence (XAI) Engine
          </h2>
          <p className="text-xs text-slate-400">
            Interpretability and decision transparency for machine learning models using SHAP and LIME
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none"
          >
            <option value="dos">Scenario 1: DoS SYN Flood</option>
            <option value="portscan">Scenario 2: Nmap Port Scan</option>
            <option value="normal">Scenario 3: Benign HTTPS Flow</option>
          </select>

          <button
            onClick={handleExplain}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 transition"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{loading ? 'Computing XAI...' : 'Explain Decision'}</span>
          </button>
        </div>
      </div>

      {/* Rationale & Global Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SHAP Card */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-rose-400" />
              SHAP Local Feature Attribution (TreeExplainer)
            </h3>
            {shapResult && (
              <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                Model: {shapResult.model_name}
              </span>
            )}
          </div>

          {shapResult ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs font-mono">
                <span className="text-slate-400 font-semibold block mb-1">Human-Readable Security Rationale:</span>
                <p className="text-slate-200 leading-relaxed font-sans">{shapResult.summary_text}</p>
              </div>

              {shapResult.graph_base64 && (
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-center">
                  <img
                    src={`data:image/png;base64,${shapResult.graph_base64}`}
                    alt="SHAP Local Attribution"
                    className="mx-auto rounded max-h-56"
                  />
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">Red: Increases Attack Risk | Green: Supports Benign Baseline</p>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Feature Weights Breakdown:</span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {shapResult.feature_contributions.map((fc) => (
                    <div key={fc.feature} className="p-2 bg-slate-900/60 rounded border border-slate-800 text-[11px] font-mono flex items-center justify-between">
                      <span className="text-slate-300 font-semibold">{fc.feature} = {fc.value}</span>
                      <span className={`font-bold ${fc.contribution > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {fc.contribution > 0 ? '+' : ''}{fc.contribution.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs font-mono">
              Select a traffic scenario and click "Explain Decision" to compute Shapley values.
            </div>
          )}
        </div>

        {/* LIME Card */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              LIME Local Surrogate Model (Tabular Explainer)
            </h3>
            {limeResult && (
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                Surrogate Probability: {(limeResult.probability * 100).toFixed(1)}%
              </span>
            )}
          </div>

          {limeResult ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs font-mono">
                <span className="text-slate-400 font-semibold block mb-1">Local Surrogate Linear Model Explanation:</span>
                <p className="text-slate-200 leading-relaxed font-sans">{limeResult.explanation_text}</p>
              </div>

              {limeResult.graph_base64 && (
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-center">
                  <img
                    src={`data:image/png;base64,${limeResult.graph_base64}`}
                    alt="LIME Rule Weights"
                    className="mx-auto rounded max-h-56"
                  />
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">Local decision boundary weights</p>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Dominant Decision Rules:</span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {limeResult.rules.map((rule, idx) => (
                    <div key={idx} className="p-2 bg-slate-900/60 rounded border border-slate-800 text-[11px] font-mono flex items-center justify-between">
                      <span className="text-slate-300">{rule.rule}</span>
                      <span className={`font-bold ${rule.weight > 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                        {rule.weight > 0 ? '+' : ''}{rule.weight.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs font-mono">
              LIME surrogate rules will generate locally interpretable linear approximations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
