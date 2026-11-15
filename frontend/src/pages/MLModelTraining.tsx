import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { TrainedModel, Dataset } from '../types';
import { Sliders, Cpu, Play, CheckCircle2, Zap, Clock, ShieldCheck } from 'lucide-react';

export const MLModelTrainingPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<TrainedModel[]>([]);
  const [selectedAlgo, setSelectedAlgo] = useState<string>('RandomForest');
  const [modelName, setModelName] = useState<string>('Random Forest IDS (Retrained)');
  const [datasetId, setDatasetId] = useState<number>(1);
  const [testSize, setTestSize] = useState<number>(0.25);
  const [training, setTraining] = useState<boolean>(false);
  const [latestTrained, setLatestTrained] = useState<TrainedModel | null>(null);

  // Hyperparameters
  const [nEstimators, setNEstimators] = useState<number>(100);
  const [maxDepth, setMaxDepth] = useState<number>(15);
  const [contamination, setContamination] = useState<number>(0.35);

  const fetchInit = async () => {
    try {
      const [dsRes, mRes] = await Promise.all([
        api.get('/datasets'),
        api.get('/models')
      ]);
      setDatasets(dsRes.data);
      setModels(mRes.data);
      if (dsRes.data.length > 0) setDatasetId(dsRes.data[0].id);
    } catch (err) {
      console.error('Failed to load datasets/models', err);
    }
  };

  useEffect(() => {
    fetchInit();
  }, []);

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    setTraining(true);
    try {
      const hyperparams: any = {};
      if (selectedAlgo === 'RandomForest') {
        hyperparams.n_estimators = nEstimators;
        hyperparams.max_depth = maxDepth;
      } else if (selectedAlgo === 'DecisionTree') {
        hyperparams.max_depth = maxDepth;
      } else if (selectedAlgo === 'IsolationForest') {
        hyperparams.contamination = contamination;
      } else if (selectedAlgo === 'XGBoost') {
        hyperparams.n_estimators = nEstimators;
        hyperparams.max_depth = 6;
      }

      const res = await api.post('/models/train', {
        name: modelName,
        algorithm: selectedAlgo,
        dataset_id: datasetId,
        test_size: testSize,
        random_state: 42,
        hyperparameters: hyperparams
      });

      setLatestTrained(res.data);
      alert(`Model successfully trained and evaluated! F1-Score: ${(res.data.f1_score * 100).toFixed(2)}%`);
      fetchInit();
    } catch (err: any) {
      alert(`Training failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setTraining(false);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await api.post(`/models/${id}/activate`);
      alert('Model activated as primary intrusion detection engine!');
      fetchInit();
    } catch (err: any) {
      alert(`Activation failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-400" />
          Machine Learning Model Training & Experimentation
        </h2>
        <p className="text-xs text-slate-400">
          Train, tune, and empirically evaluate multi-class and anomaly detection models with zero data leakage
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Training Configuration Panel */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            Training Configuration
          </h3>

          <form onSubmit={handleTrain} className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-slate-400">Algorithm</label>
              <select
                value={selectedAlgo}
                onChange={(e) => {
                  setSelectedAlgo(e.target.value);
                  setModelName(`${e.target.value} IDS`);
                }}
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
              >
                <option value="RandomForest">Random Forest (Ensemble)</option>
                <option value="DecisionTree">Decision Tree (CART)</option>
                <option value="SVM">Support Vector Machine (SVC)</option>
                <option value="IsolationForest">Isolation Forest (Anomaly Detection)</option>
                <option value="XGBoost">XGBoost (Gradient Boosted Trees)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400">Model Name Identifier</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                required
              />
            </div>

            <div>
              <label className="text-slate-400">Training Dataset</label>
              <select
                value={datasetId}
                onChange={(e) => setDatasetId(parseInt(e.target.value))}
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
              >
                {datasets.map((ds) => (
                  <option key={ds.id} value={ds.id}>{ds.name} ({ds.row_count} rows)</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400">Test Split Ratio</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="0.4"
                  value={testSize}
                  onChange={(e) => setTestSize(parseFloat(e.target.value))}
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                />
              </div>

              {selectedAlgo === 'IsolationForest' ? (
                <div>
                  <label className="text-slate-400">Contamination</label>
                  <input
                    type="number"
                    step="0.05"
                    value={contamination}
                    onChange={(e) => setContamination(parseFloat(e.target.value))}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-slate-400">Max Depth</label>
                  <input
                    type="number"
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={training}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-sans text-xs font-semibold py-2.5 rounded-lg transition mt-3 flex items-center justify-center gap-2"
            >
              {training ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Fitting & Evaluating...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute Training Experiment</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Trained Models & Research Metrics */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-white">Trained Model Registry ({models.length})</h3>
          <div className="space-y-3">
            {models.map((m) => (
              <div
                key={m.id}
                className={`bg-[#0f172a] border rounded-xl p-4 transition ${
                  m.is_active ? 'border-emerald-500/40 soc-glow' : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-white">{m.name}</h4>
                      <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        {m.algorithm}
                      </span>
                      {m.is_active && (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE IN PRODUCTION
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">Trained on: {new Date(m.created_at).toLocaleString()}</span>
                  </div>

                  {!m.is_active && (
                    <button
                      onClick={() => handleActivate(m.id)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg font-mono transition"
                    >
                      Activate for IDS
                    </button>
                  )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-3 text-center text-xs font-mono">
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400">Accuracy</span>
                    <p className="font-bold text-emerald-400 mt-0.5">{(m.accuracy * 100).toFixed(2)}%</p>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400">Precision</span>
                    <p className="font-bold text-white mt-0.5">{(m.precision * 100).toFixed(2)}%</p>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400">Recall</span>
                    <p className="font-bold text-white mt-0.5">{(m.recall * 100).toFixed(2)}%</p>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400">F1-Score</span>
                    <p className="font-bold text-blue-400 mt-0.5">{(m.f1_score * 100).toFixed(2)}%</p>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400">FPR</span>
                    <p className="font-bold text-rose-400 mt-0.5">{(m.false_positive_rate * 100).toFixed(2)}%</p>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400">Latency</span>
                    <p className="font-bold text-amber-400 mt-0.5">{m.detection_time_ms.toFixed(4)} ms</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
