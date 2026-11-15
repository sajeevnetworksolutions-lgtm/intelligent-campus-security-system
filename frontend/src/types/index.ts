export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  department: string;
  is_active: boolean;
  is_locked: boolean;
  created_at: string;
  last_login?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  username: string;
  role: string;
  full_name: string;
  department: string;
}

export interface Dataset {
  id: number;
  name: string;
  filename: string;
  file_size_bytes: number;
  row_count: number;
  col_count: number;
  target_column: string;
  features: string[];
  class_distribution: Record<string, number>;
  missing_values_count: number;
  duplicate_rows_count: number;
  is_validated: boolean;
  is_benchmark: boolean;
  description?: string;
  created_at: string;
}

export interface TrainedModel {
  id: number;
  name: string;
  algorithm: string;
  dataset_id: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  false_positive_rate: number;
  detection_time_ms: number;
  training_duration_sec: number;
  is_active: boolean;
  feature_names: string[];
  target_names: string[];
  created_at: string;
}

export interface ModelComparisonItem {
  algorithm: string;
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  false_positive_rate: number;
  detection_time_ms: number;
  training_duration_sec: number;
  rank_score: number;
  is_recommended: boolean;
}

export interface SecurityEvent {
  id: number;
  timestamp: string;
  source_ip: string;
  destination_ip: string;
  protocol: string;
  service: string;
  attack_category: string;
  predicted_class: string;
  confidence: number;
  risk_score: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  is_simulation: boolean;
}

export interface Alert {
  id: number;
  alert_code: string;
  timestamp: string;
  title: string;
  description: string;
  threat_category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  source: string;
  source_ip?: string;
  model_name?: string;
  explanation?: string;
  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  resolution_notes?: string;
  incident_id?: number;
  created_at: string;
}

export interface Incident {
  id: number;
  incident_number: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';
  assigned_to: string;
  root_cause?: string;
  mitigation_steps?: string;
  created_at: string;
  updated_at: string;
  notes: {
    id: number;
    author_name: string;
    note_text: string;
    created_at: string;
  }[];
}

export interface SOCSummaryKPI {
  total_events: number;
  total_threats: number;
  critical_alerts: number;
  high_risk_incidents: number;
  normal_traffic_pct: number;
  suspicious_login_attempts: number;
  active_model_accuracy: number;
  active_users: number;
  active_model_name: string;
  active_model_algorithm: string;
}

export interface FeatureContribution {
  feature: string;
  value: any;
  contribution: number;
  description: string;
}

export interface SHAPExplanation {
  model_name: string;
  predicted_class: string;
  confidence: number;
  base_value: number;
  feature_contributions: FeatureContribution[];
  summary_text: string;
  graph_base64?: string;
}

export interface LIMEExplanation {
  model_name: string;
  predicted_class: string;
  probability: number;
  local_prediction: number;
  intercept: number;
  rules: { rule: string; weight: number; impact: string }[];
  explanation_text: string;
  graph_base64?: string;
}

export interface UBAProfileOut {
  username: string;
  total_logins: number;
  failed_logins: number;
  success_rate_pct: number;
  suspicious_events_count: number;
  risk_rating: string;
  last_known_ip: string;
  last_activity: string;
  anomalies_detected: string[];
}

