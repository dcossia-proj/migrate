"use server"
import { createClient } from "@supabase/supabase-js"

// Server-side Supabase client with service role
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function submitFormData(prevState: any, formData: FormData) {
  try {
    // Check if formData exists
    if (!formData) {
      throw new Error("No form data received")
    }

    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const image = formData.get("image") as File
    const userId = formData.get("userId") as string

    // Validate required fields
    if (!title || !content || !userId) {
      throw new Error("Missing required fields")
    }

    let imageUrl = null

    // Upload image if provided
    if (image && image.size > 0) {
      const fileExt = image.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("form-images")
        .upload(fileName, image)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from("form-images").getPublicUrl(fileName)

      imageUrl = publicUrl
    }

    // Insert form submission into database
    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .insert({
        user_id: userId,
        title,
        content,
        image_url: imageUrl,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Send to Discord webhook
    if (process.env.DISCORD_WEBHOOK_URL) {
      const discordPayload = {
        embeds: [
          {
            title: `New Form Submission: ${title}`,
            description: content,
            color: 0x00ff00,
            fields: [
              {
                name: "User ID",
                value: userId,
                inline: true,
              },
              {
                name: "Submitted At",
                value: new Date().toISOString(),
                inline: true,
              },
            ],
            ...(imageUrl && {
              image: {
                url: imageUrl,
              },
            }),
          },
        ],
      }

      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(discordPayload),
      })
    }

    return { success: true, message: "Form submitted successfully!", data }
  } catch (error: any) {
    console.error("Error submitting form:", error)
    return { success: false, error: error.message }
  }
}

export async function getUserSubmissions(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
