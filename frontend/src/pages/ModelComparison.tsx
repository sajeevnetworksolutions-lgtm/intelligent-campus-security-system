import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ModelComparisonItem } from '../types';
import { BarChart2, Award, Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export const ModelComparisonPage: React.FC = () => {
  const [comparisons, setComparisons] = useState<ModelComparisonItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const res = await api.get('/models/compare');
        setComparisons(res.data);
      } catch (err) {
        console.error('Failed to load comparison data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchComparison();
  }, []);

  const chartData = comparisons.map((c) => ({
    algorithm: c.algorithm,
    Accuracy: parseFloat((c.accuracy * 100).toFixed(2)),
    Precision: parseFloat((c.precision * 100).toFixed(2)),
    Recall: parseFloat((c.recall * 100).toFixed(2)),
    F1_Score: parseFloat((c.f1_score * 100).toFixed(2)),
    FPR: parseFloat((c.false_positive_rate * 100).toFixed(2))
  }));

  const recommended = comparisons.find((c) => c.is_recommended) || comparisons[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            Machine Learning Algorithm Comparison & Benchmarking
          </h2>
          <p className="text-xs text-slate-400">
            Empirical multi-criteria evaluation of Random Forest, Decision Tree, SVM, Isolation Forest, and XGBoost
          </p>
        </div>
      </div>

      {/* Recommended Model Highlight Card */}
      {recommended && (
        <div className="bg-gradient-to-r from-blue-900/30 via-slate-900 to-slate-900 border border-blue-500/30 rounded-xl p-5 soc-glow">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 w-fit">
                <Award className="w-3.5 h-3.5 text-blue-400" />
                OBJECTIVELY RECOMMENDED PRIMARY CLASSIFIER
              </span>
              <h3 className="text-lg font-bold text-white font-sans">
                {recommended.algorithm} ({recommended.model_name})
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                Selected as the production classifier based on a multi-objective composite score (F1-Score weight 50%, FPR penalty 30%, and Recall weight 20%). 
                Demonstrated an optimal trade-off with an F1-Score of <b>{(recommended.f1_score * 100).toFixed(2)}%</b>, a False Positive Rate of <b>{(recommended.false_positive_rate * 100).toFixed(2)}%</b>, and sub-millisecond detection latency of <b>{recommended.detection_time_ms.toFixed(4)} ms</b>.
              </p>
            </div>

            <div className="hidden sm:flex flex-col items-end font-mono">
              <span className="text-xs text-slate-400">Composite Score</span>
              <span className="text-2xl font-bold text-blue-400">{recommended.rank_score}</span>
            </div>
          </div>
        </div>
      )}

      {/* Comparative Evaluation Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Empirical Benchmark Results Table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Algorithm</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-4">Precision</th>
                <th className="py-3 px-4">Recall</th>
                <th className="py-3 px-4">F1-Score</th>
                <th className="py-3 px-4">FPR</th>
                <th className="py-3 px-4">Detection Latency</th>
                <th className="py-3 px-4">Training Time</th>
                <th className="py-3 px-4 text-right">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {comparisons.map((item) => (
                <tr key={item.algorithm} className={`hover:bg-slate-900/60 transition ${item.is_recommended ? 'bg-blue-600/5' : ''}`}>
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                    {item.algorithm}
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">{(item.accuracy * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-slate-200">{(item.precision * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-slate-200">{(item.recall * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-blue-400 font-bold">{(item.f1_score * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-rose-400 font-bold">{(item.false_positive_rate * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-amber-400">{item.detection_time_ms.toFixed(4)} ms</td>
                  <td className="py-3 px-4 text-slate-400">{item.training_duration_sec.toFixed(2)} s</td>
                  <td className="py-3 px-4 text-right">
                    {item.is_recommended ? (
                      <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                        RECOMMENDED
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">Evaluated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparative Bar Chart */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Metric Comparison (Accuracy, Precision, Recall, F1-Score)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="algorithm" stroke="#64748b" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Accuracy" fill="#10b981" />
              <Bar dataKey="Precision" fill="#3b82f6" />
              <Bar dataKey="Recall" fill="#8b5cf6" />
              <Bar dataKey="F1_Score" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
