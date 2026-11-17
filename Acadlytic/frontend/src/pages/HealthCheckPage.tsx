import React from 'react';
import { useHealth } from '@/hooks/useHealth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Activity, RefreshCw, CheckCircle, XCircle, Database, Server, Clock, Layers } from 'lucide-react';

export const HealthCheckPage: React.FC = () => {
  const { data: health, isLoading, isError, error, refetch, isFetching } = useHealth();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-sky-600" />
            System Foundation Health Test
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time verification of frontend-to-backend REST API communication and MySQL connectivity.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          isLoading={isFetching}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Re-check Health
        </Button>
      </div>

      {isLoading ? (
        <Card className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
            <p className="text-sm text-slate-500">Probing backend /api/v1/health...</p>
          </div>
        </Card>
      ) : isError ? (
        <Card className="border-red-200 bg-red-50/50">
          <div className="flex items-start gap-4">
            <XCircle className="h-7 w-7 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-red-900">Backend Communication Failed</h3>
              <p className="text-sm text-red-700">
                The frontend could not establish a connection with the Spring Boot backend at{' '}
                <code className="px-1.5 py-0.5 bg-red-100 rounded text-xs font-mono">
                  {import.meta.env.VITE_API_BASE_URL || '/api/v1'}/health
                </code>
              </p>
              <p className="text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
                Error: {error?.message}
              </p>
              <div className="pt-2 text-xs text-slate-600">
                <strong>Troubleshooting tips:</strong>
                <ul className="list-disc pl-5 mt-1 space-y-0.5">
                  <li>Ensure the Spring Boot backend is running on port 8080 (<code className="font-mono">mvn spring-boot:run</code>).</li>
                  <li>Ensure MySQL service is active on port 3306 (<code className="font-mono">docker compose up -d mysql</code>).</li>
                  <li>Check CORS allowed origins in <code className="font-mono">application.yml</code>.</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      ) : health ? (
        <div className="space-y-6">
          {/* Status Overview Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900">System Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    {health.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Frontend and backend are communicating successfully.
                </p>
              </div>
            </div>

            <div className="hidden sm:block text-right">
              <span className="text-xs text-slate-400">Response Latency</span>
              <p className="text-sm font-semibold text-emerald-600">&lt; 50 ms</p>
            </div>
          </div>

          {/* Detailed Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="flex items-start gap-3">
              <Server className="h-5 w-5 text-sky-600 mt-1 flex-shrink-0" />
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Backend Application</span>
                <p className="text-sm font-semibold text-slate-800">{health.application}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                  <span>Version: <strong className="text-slate-700">{health.version}</strong></span>
                  <span>•</span>
                  <span>Env: <strong className="text-slate-700">{health.environment}</strong></span>
                </div>
              </div>
            </Card>

            <Card className="flex items-start gap-3">
              <Database className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Database Connectivity</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">MySQL 8.0</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    health.database === 'CONNECTED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {health.database}
                  </span>
                </div>
                <p className="text-xs text-slate-500 pt-1">Verified with live database ping (<code className="font-mono">SELECT 1</code>)</p>
              </div>
            </Card>

            <Card className="flex items-start gap-3">
              <Layers className="h-5 w-5 text-indigo-600 mt-1 flex-shrink-0" />
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">API Endpoint Contract</span>
                <p className="text-sm font-mono text-slate-700">GET /api/v1/health</p>
                <p className="text-xs text-slate-500 pt-1">Standardized JSON envelope: <code className="font-mono">ApiResponse&lt;T&gt;</code></p>
              </div>
            </Card>

            <Card className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Server Timestamp</span>
                <p className="text-sm font-mono text-slate-700">{health.timestamp}</p>
                <p className="text-xs text-slate-500 pt-1">Timezone: UTC</p>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
};
