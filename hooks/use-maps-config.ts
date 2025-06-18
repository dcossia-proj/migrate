"use client"

import { useState, useEffect } from "react"

interface MapsConfig {
  apiKey: string | null
  loading: boolean
  error: string | null
}

export function useMapsConfig(): MapsConfig {
  const [config, setConfig] = useState<MapsConfig>({
    apiKey: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    async function fetchConfig() {
      try {
        console.log("Fetching maps config...")

        const response = await fetch("/api/maps-config")
        console.log("Response status:", response.status)

        const data = await response.json()
        console.log("Response data:", data)

        if (!response.ok) {
          throw new Error(data.error || `HTTP error! status: ${response.status}`)
        }

        if (!data.success) {
          throw new Error(data.error || "API returned unsuccessful response")
        }

        setConfig({
          apiKey: data.apiKey,
          loading: false,
          error: null,
        })
      } catch (error) {
        console.error("Error fetching maps config:", error)
        setConfig({
          apiKey: null,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        })
      }
    }

    fetchConfig()
  }, [])

  return config
}
