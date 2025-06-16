"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function ThankYouPage() {
  const [htmlContent, setHtmlContent] = useState("")
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")

  useEffect(() => {
    const loadThankYouPage = async () => {
      try {
        // Fetch the HTML template
        const response = await fetch("/thank-you-template.html")
        let html = await response.text()

        // Get user's name if userId is provided
        if (userId) {
          const { data: profile } = await supabase.from("user_profiles").select("full_name").eq("id", userId).single()

          if (profile?.full_name) {
            // Replace "Valued Customer" with the user's actual name
            html = html.replace("Valued Customer", profile.full_name)
          }
        }

        // Insert the delivery text message between the two sentences
        html = html.replace(
          "Your order has been placed! We were happy to serve you!",
          "Your order has been placed! You should receive a text message within the next 10 minutes with delivery info. We were happy to serve you!",
        )

        setHtmlContent(html)
      } catch (error) {
        console.error("Error loading thank you page:", error)
        // Fallback HTML if there's an error
        setHtmlContent(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1>Thank You!</h1>
              <p>Your order has been placed successfully!</p>
            </body>
          </html>
        `)
      } finally {
        setLoading(false)
      }
    }

    loadThankYouPage()
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
}
