import { NextResponse } from "next/server"

export async function GET() {
  console.log("Maps config API called")

  try {
    // Use server-only environment variable (without NEXT_PUBLIC_ prefix)
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    console.log("API Key exists:", !!apiKey)
    console.log(
      "Available env vars:",
      Object.keys(process.env).filter((key) => key.includes("GOOGLE")),
    )

    if (!apiKey) {
      console.error("Google Maps API key not found in environment variables")
      return NextResponse.json(
        {
          error: "Google Maps API key not configured",
          success: false,
        },
        { status: 500 },
      )
    }

    console.log("Returning API key successfully")

    // Return the API key securely to authorized clients only
    return NextResponse.json({
      apiKey: apiKey,
      success: true,
    })
  } catch (error) {
    console.error("Error in maps-config API:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch maps configuration",
        details: error instanceof Error ? error.message : "Unknown server error",
        success: false,
      },
      { status: 500 },
    )
  }
}
