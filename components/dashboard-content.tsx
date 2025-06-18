"use client"

import type React from "react"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardContent() {
  const [text, setText] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const supabase = createClientComponentClient()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0])
    }
  }

  const applyGreyscale = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.crossOrigin = "anonymous"
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height

        // Draw original image
        ctx?.drawImage(img, 0, 0)

        // Get image data and apply greyscale
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data

          for (let i = 0; i < data.length; i += 4) {
            const grey = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
            data[i] = grey // red
            data[i + 1] = grey // green
            data[i + 2] = grey // blue
          }

          ctx.putImageData(imageData, 0, 0)
        }

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const greyscaleFile = new File([blob], `greyscale_${file.name}`, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(greyscaleFile)
          }
        }, file.type)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      let imageUrl = null

      // Upload image if provided
      if (image) {
        // Apply greyscale filter
        const greyscaleImage = await applyGreyscale(image)

        const fileExt = greyscaleImage.name.split(".").pop()
        const fileName = `${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("images")
          .upload(fileName, greyscaleImage)

        if (uploadError) {
          throw uploadError
        }

        const { data: urlData } = supabase.storage.from("images").getPublicUrl(fileName)

        imageUrl = urlData.publicUrl
      }

      // Save to database - update this section
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error: dbError } = await supabase.from("submissions").insert([
        {
          text_content: text,
          image_url: imageUrl,
          user_id: user?.id,
          created_at: new Date().toISOString(),
        },
      ])

      if (dbError) {
        throw dbError
      }

      // Send to Discord webhook
      if (process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL) {
        const discordPayload = {
          content: "New form submission!",
          embeds: [
            {
              title: "Form Submission",
              description: text,
              color: 0x808080, // Grey color for greyscale theme
              timestamp: new Date().toISOString(),
              ...(imageUrl && {
                image: {
                  url: imageUrl,
                },
              }),
            },
          ],
        }

        await fetch("/api/discord-webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(discordPayload),
        })
      }

      setMessage("Form submitted successfully!")
      setText("")
      setImage(null)

      // Reset file input
      const fileInput = document.getElementById("image") as HTMLInputElement
      if (fileInput) {
        fileInput.value = ""
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setMessage("Error submitting form. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Submit Your Content</CardTitle>
          <CardDescription>Share text and images. Images will be automatically converted to greyscale.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="text">Text Content</Label>
              <Textarea
                id="text"
                placeholder="Enter your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image (optional)</Label>
              <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
              {image && (
                <p className="text-sm text-gray-600">Selected: {image.name} (will be converted to greyscale)</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Form"}
            </Button>
          </form>

          {message && (
            <div
              className={`mt-4 p-4 rounded-md ${
                message.includes("successfully")
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
