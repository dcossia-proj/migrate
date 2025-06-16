import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, address, deliveryInstructions, totalCost, tip, imageUrls, userEmail, submittedAt } = body

    if (!process.env.DISCORD_WEBHOOK_URL) {
      console.log("Discord webhook URL not configured")
      return NextResponse.json({ success: false, error: "Discord webhook not configured" })
    }

    // First, send the order information embed (without images)
    const orderInfoPayload = {
      embeds: [
        {
          title: `New Order Submission: ${name}`,
          description: `**Address:** ${address}\n\n**Delivery Instructions:** ${deliveryInstructions}${totalCost ? `\n\n**Total Cost:** $${totalCost.toFixed(2)}` : ""}${tip ? `\n\n**Tip:** $${tip.toFixed(2)}` : ""}`,
          color: 0x00ff00,
          fields: [
            {
              name: "Customer Email",
              value: userEmail || "Unknown",
              inline: true,
            },
            {
              name: "Phone #",
              value: phone,
              inline: true,
            },
            {
              name: "Submitted At",
              value: new Date(submittedAt).toLocaleString(),
              inline: true,
            },
          ],
        },
      ],
    }

    // Send the order information first
    const orderResponse = await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderInfoPayload),
    })

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text()
      console.error("Discord order info webhook failed:", errorText)
      return NextResponse.json({ success: false, error: "Discord order info webhook failed" })
    }

    // Then send images in batches of 10 as embeds (so they display as actual images)
    if (imageUrls && imageUrls.length > 0) {
      const batchSize = 10
      const totalBatches = Math.ceil(imageUrls.length / batchSize)

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * batchSize
        const endIndex = Math.min(startIndex + batchSize, imageUrls.length)
        const batchImages = imageUrls.slice(startIndex, endIndex)

        // Create embeds for each image in this batch
        const imageEmbeds = batchImages.map((imageUrl, index) => {
          const imageNumber = startIndex + index + 1
          return {
            title: `Image ${imageNumber}${totalBatches > 1 ? ` (Batch ${batchIndex + 1}/${totalBatches})` : ""}`,
            image: {
              url: imageUrl,
            },
            color: 0x0099ff, // Different color for image embeds
          }
        })

        const imagePayload = {
          embeds: imageEmbeds,
        }

        // Send the batch of images
        const imageResponse = await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(imagePayload),
        })

        if (!imageResponse.ok) {
          const errorText = await imageResponse.text()
          console.error(`Discord images batch ${batchIndex + 1} webhook failed:`, errorText)
          // Continue with other batches even if one fails
        }

        // Add a small delay between batches to avoid rate limiting
        if (batchIndex < totalBatches - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Discord webhook error:", error)
    return NextResponse.json({ success: false, error: error.message })
  }
}
