"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "@supabase/supabase-js"

interface ProfileTestProps {
  user: User
}

export default function ProfileTest({ user }: ProfileTestProps) {
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testProfileRead = async () => {
    setLoading(true)
    try {
      console.log("Testing profile read for user:", user.id)

      const { data, error } = await supabase.from("user_profiles").select("*").eq("id", user.id).maybeSingle()

      if (error) {
        console.error("Profile read error:", error)
        setProfileData({ error: error.message })
      } else {
        console.log("Profile read success:", data)
        setProfileData(data)
      }
    } catch (error: any) {
      console.error("Profile read exception:", error)
      setProfileData({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testProfileWrite = async () => {
    setLoading(true)
    try {
      console.log("Testing profile write for user:", user.id)

      const testData = {
        id: user.id,
        full_name: "Test Name " + Date.now(),
        phone_number: "555-0123",
        address: "123 Test St, Test City, TS 12345",
        delivery_instructions: "Test delivery instructions",
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("user_profiles").upsert(testData, { onConflict: "id" }).select()

      if (error) {
        console.error("Profile write error:", error)
        setProfileData({ error: error.message })
      } else {
        console.log("Profile write success:", data)
        setProfileData(data)
      }
    } catch (error: any) {
      console.error("Profile write exception:", error)
      setProfileData({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mb-4">
      <CardHeader>
        <CardTitle>Profile Functionality Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testProfileRead} disabled={loading}>
            Test Profile Read
          </Button>
          <Button onClick={testProfileWrite} disabled={loading}>
            Test Profile Write
          </Button>
        </div>

        {profileData && (
          <div className="p-3 bg-gray-50 rounded-md">
            <h4 className="font-semibold mb-2">Profile Data:</h4>
            <pre className="text-sm whitespace-pre-wrap overflow-auto">{JSON.stringify(profileData, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
