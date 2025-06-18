import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Use server-only environment variable
    const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY

    // Process webhook data
    console.log("Webhook received:", body)

    // Send to Discord if webhook URL is configured
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL

    if (discordWebhookUrl) {
      const discordPayload = {
        content: `New form submission received`,
        embeds: [
          {
            title: "Form Submission",
            description: `Data: ${JSON.stringify(body, null, 2)}`,
            color: 0x00ff00,
            timestamp: new Date().toISOString(),
          },
        ],
      }

      await fetch(discordWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(discordPayload),
      })
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
    })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
