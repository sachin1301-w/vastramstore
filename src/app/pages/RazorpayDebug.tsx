import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export function RazorpayDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const fetchDebugInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/debug/razorpay`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch debug info');
      }

      setDebugInfo(data);
      console.log('🔍 Razorpay Debug Info:', data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching debug info:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ condition, label }: { condition: boolean; label: string }) => (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
      {condition ? (
        <CheckCircle className="w-5 h-5 text-green-600" />
      ) : (
        <XCircle className="w-5 h-5 text-red-600" />
      )}
      <span className="text-sm font-medium">{label}</span>
      <span className={`ml-auto text-sm font-bold ${condition ? 'text-green-600' : 'text-red-600'}`}>
        {condition ? 'YES' : 'NO'}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Razorpay Debug Tool
          </h1>
          <p className="text-gray-600">Check your Razorpay integration status</p>
          <Button
            onClick={fetchDebugInfo}
            disabled={loading}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              'Refresh Status'
            )}
          </Button>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8"
          >
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && !debugInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center"
          >
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading debug information...</p>
          </motion.div>
        )}

        {/* Debug Info */}
        {debugInfo && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Overall Status */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                {debugInfo.credentialsValid ? (
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                ) : (
                  <div className="bg-red-100 p-3 rounded-full">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {debugInfo.credentialsValid ? 'Razorpay Connected ✅' : 'Connection Failed ❌'}
                  </h2>
                  <p className="text-gray-600">
                    {debugInfo.credentialsValid 
                      ? 'Your Razorpay integration is working correctly'
                      : 'There is an issue with your Razorpay configuration'
                    }
                  </p>
                </div>
              </div>

              {debugInfo.testResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">✅ {debugInfo.testResult}</p>
                </div>
              )}

              {debugInfo.testError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-medium mb-2">❌ Connection Test Failed</p>
                  <p className="text-red-700 text-sm">Error: {debugInfo.testError}</p>
                  {debugInfo.testErrorCode && (
                    <p className="text-red-600 text-xs mt-1">Code: {debugInfo.testErrorCode}</p>
                  )}
                </div>
              )}
            </div>

            {/* Configuration Details */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-blue-600" />
                Configuration Details
              </h3>

              <div className="space-y-3">
                <StatusBadge 
                  condition={debugInfo.keyIdPresent} 
                  label="API Key ID Present" 
                />
                <StatusBadge 
                  condition={debugInfo.keySecretPresent} 
                  label="API Key Secret Present" 
                />
                <StatusBadge 
                  condition={debugInfo.razorpayInitialized} 
                  label="Razorpay SDK Initialized" 
                />
                <StatusBadge 
                  condition={debugInfo.isLiveMode} 
                  label="Live Mode Enabled" 
                />
              </div>

              {/* Key Details */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                {debugInfo.keyIdPrefix && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Key ID Prefix</span>
                    <code className="text-sm font-mono bg-gray-200 px-2 py-1 rounded">
                      {debugInfo.keyIdPrefix}...
                    </code>
                  </div>
                )}
                {debugInfo.keyIdLength && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Key ID Length</span>
                    <span className="text-sm font-bold text-gray-900">{debugInfo.keyIdLength} characters</span>
                  </div>
                )}
                {debugInfo.keySecretLength && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Key Secret Length</span>
                    <span className="text-sm font-bold text-gray-900">{debugInfo.keySecretLength} characters</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            {!debugInfo.credentialsValid && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  Troubleshooting Steps
                </h3>
                <ul className="space-y-3 text-amber-900">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">1.</span>
                    <span>Check that your Razorpay API keys are correctly set in Supabase environment variables</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">2.</span>
                    <span>Ensure you're using LIVE mode keys (starting with <code className="bg-amber-200 px-1 rounded">rzp_live_</code>)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">3.</span>
                    <span>Verify your Razorpay account is fully activated and KYC is complete</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">4.</span>
                    <span>Check that the API keys haven't been revoked or expired</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">5.</span>
                    <span>Try regenerating your API keys in the Razorpay dashboard</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-center text-sm text-gray-500">
              Last checked: {debugInfo.timestamp ? new Date(debugInfo.timestamp).toLocaleString() : 'Unknown'}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
