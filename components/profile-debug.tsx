"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "@supabase/supabase-js"

interface ProfileDebugProps {
  user: User
}

export default function ProfileDebug({ user }: ProfileDebugProps) {
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkProfile = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("user_profiles").select("*").eq("id", user.id).maybeSingle()

      if (error) {
        console.error("Error:", error)
        setProfileData({ error: error.message })
      } else {
        setProfileData(data)
      }
    } catch (error: any) {
      setProfileData({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mb-4">
      <CardHeader>
        <CardTitle>Profile Debug (Temporary)</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={checkProfile} disabled={loading} className="mb-4">
          {loading ? "Checking..." : "Check Profile Data"}
        </Button>

        {profileData && (
          <div className="p-3 bg-gray-50 rounded-md">
            <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(profileData, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
