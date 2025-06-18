"use client"

import type React from "react"
import type { User } from "@supabase/auth-helpers-nextjs"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Upload, Send } from "lucide-react"

interface GreyscaleDashboardProps {
  user: User
}

export default function GreyscaleDashboard({ user }: GreyscaleDashboardProps) {
  const [text, setText] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

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

        ctx?.drawImage(img, 0, 0)

        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data

          for (let i = 0; i < data.length; i += 4) {
            const grey = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
            data[i] = grey
            data[i + 1] = grey
            data[i + 2] = grey
          }

          ctx.putImageData(imageData, 0, 0)
        }

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

      if (image) {
        const greyscaleImage = await applyGreyscale(image)
        const fileExt = greyscaleImage.name.split(".").pop()
        const fileName = `${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("images")
          .upload(fileName, greyscaleImage)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from("images").getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      }

      const { error: dbError } = await supabase.from("submissions").insert([
        {
          text_content: text,
          image_url: imageUrl,
          user_id: user.id,
          created_at: new Date().toISOString(),
        },
      ])

      if (dbError) throw dbError

      // Send to Discord
      const discordPayload = {
        content: "New Greysale submission!",
        embeds: [
          {
            title: "Form Submission",
            description: text,
            color: 0x6b7280,
            timestamp: new Date().toISOString(),
            ...(imageUrl && {
              image: { url: imageUrl },
            }),
          },
        ],
      }

      await fetch("/api/discord-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload),
      })

      setMessage("Submission sent successfully!")
      setText("")
      setImage(null)

      const fileInput = document.getElementById("image") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (error) {
      console.error("Error:", error)
      setMessage("Error submitting form. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Greysale</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-slate-400">{user.email}</span>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Submit Content</CardTitle>
            <CardDescription className="text-slate-400">
              Share your text and images. Images will be automatically converted to greyscale.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Text Content</label>
                <Textarea
                  placeholder="Enter your message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-slate-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Image (optional)</label>
                <div className="relative">
                  <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white file:bg-slate-600 file:text-white file:border-0"
                  />
                </div>
                {image && <p className="text-sm text-slate-400">Selected: {image.name} (will be greyscaled)</p>}
              </div>

              <Button type="submit" className="w-full bg-slate-600 hover:bg-slate-500 text-white" disabled={loading}>
                <Send className="h-4 w-4 mr-2" />
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </form>

            {message && (
              <div
                className={`mt-4 p-3 rounded-md text-sm ${
                  message.includes("successfully")
                    ? "bg-green-900/20 text-green-400 border border-green-800"
                    : "bg-red-900/20 text-red-400 border border-red-800"
                }`}
              >
                {message}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
