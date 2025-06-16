"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SubmissionForm from "./submission-form"
import UserSubmissions from "./user-submissions"
import AnimatedBackground from "./animated-background"
import type { User } from "@supabase/supabase-js"

interface DashboardProps {
  user: User
}

export default function Dashboard({ user }: DashboardProps) {
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [nameLoading, setNameLoading] = useState(true)

  // Fetch user's name from profile
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        setNameLoading(true)
        const { data, error } = await supabase.from("user_profiles").select("full_name").eq("id", user.id).maybeSingle()

        if (error) {
          console.error("Error fetching user name:", error)
          return
        }

        if (data?.full_name) {
          setUserName(data.full_name)
        }
      } catch (error) {
        console.error("Error fetching user name:", error)
      } finally {
        setNameLoading(false)
      }
    }

    fetchUserName()
  }, [user.id])

  const handleSignOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setLoading(false)
  }

  const displayName = userName || user.email

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen relative">
        {/* Truly transparent header that shows the beautiful background */}
        <header className="bg-black/20 backdrop-blur-md border-b border-white/10 shadow-2xl safe-top">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 safe-left safe-right">
            {/* Desktop Layout - Single Row */}
            <div className="hidden sm:flex justify-between items-center py-4">
              {/* Left: Welcome Message */}
              <span className="text-gray-200 drop-shadow-md flex-1">
                {nameLoading ? "Loading..." : `Welcome, ${displayName}`}
              </span>

              {/* Center: Title */}
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent drop-shadow-lg flex-1 text-center">
                Greysale
              </h1>

              {/* Right: Sign Out Button */}
              <div className="flex-1 flex justify-end">
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg"
                >
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Mobile Layout - Unchanged */}
            <div className="sm:hidden py-4 space-y-3">
              {/* Top row: Title and Sign Out button */}
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent drop-shadow-lg">
                  Greysale
                </h1>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 text-sm px-3 py-2 shadow-lg"
                >
                  Sign Out
                </Button>
              </div>

              {/* Bottom row: Welcome message */}
              <div className="text-center">
                <span className="text-gray-200 text-sm drop-shadow-md">
                  {nameLoading ? "Loading..." : `Welcome, ${displayName}`}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 safe-left safe-right safe-bottom">
          <Tabs defaultValue="submit" className="space-y-8">
            {/* Centered tabs */}
            <div className="flex justify-center">
              <TabsList className="bg-black/20 backdrop-blur-md border border-white/10 shadow-xl">
                <TabsTrigger
                  value="submit"
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg text-gray-200 transition-all duration-300"
                >
                  Submit Order
                </TabsTrigger>
                <TabsTrigger
                  value="submissions"
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg text-gray-200 transition-all duration-300"
                >
                  My Orders
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="submit">
              <SubmissionForm user={user} />
            </TabsContent>

            <TabsContent value="submissions">
              <UserSubmissions user={user} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  )
}
