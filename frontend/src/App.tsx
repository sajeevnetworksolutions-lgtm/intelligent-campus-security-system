import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';

import { OverviewPage } from './pages/Overview';
import { LiveThreatMonitoringPage } from './pages/LiveThreatMonitoring';
import { NetworkIntrusionDetectionPage } from './pages/NetworkIntrusionDetection';
import { UserBehaviourAnalyticsPage } from './pages/UserBehaviourAnalytics';
import { AlertsNotificationsPage } from './pages/AlertsNotifications';
import { IncidentManagementPage } from './pages/IncidentManagement';
import { DatasetManagementPage } from './pages/DatasetManagement';
import { MLModelTrainingPage } from './pages/MLModelTraining';
import { ModelComparisonPage } from './pages/ModelComparison';
import { ExplainableAIPage } from './pages/ExplainableAI';
import { LiveSimulationPage } from './pages/LiveSimulation';
import { UserManagementPage } from './pages/UserManagement';
import { AuditLogsPage } from './pages/AuditLogs';
import { ReportsAnalyticsPage } from './pages/ReportsAnalytics';
import { LoginPage } from './pages/Login';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="live-threats" element={<LiveThreatMonitoringPage />} />
            <Route path="detection" element={<NetworkIntrusionDetectionPage />} />
            <Route path="uba" element={<UserBehaviourAnalyticsPage />} />
            <Route path="alerts" element={<AlertsNotificationsPage />} />
            <Route path="incidents" element={<IncidentManagementPage />} />
            <Route path="datasets" element={<DatasetManagementPage />} />
            <Route path="training" element={<MLModelTrainingPage />} />
            <Route path="comparison" element={<ModelComparisonPage />} />
            <Route path="xai" element={<ExplainableAIPage />} />
            <Route path="simulation" element={<LiveSimulationPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="audit" element={<AuditLogsPage />} />
            <Route path="reports" element={<ReportsAnalyticsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
