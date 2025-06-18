"use client"

import { useMapsConfig } from "@/hooks/use-maps-config"

export default function TestMapsPage() {
  const { apiKey, loading, error } = useMapsConfig()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Maps Config Test</h1>

      {loading && <p>Loading...</p>}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {apiKey && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <strong>Success:</strong> API Key loaded (length: {apiKey.length})
        </div>
      )}

      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Debug Info:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify({ apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : null, loading, error }, null, 2)}
        </pre>
      </div>
    </div>
  )
}
