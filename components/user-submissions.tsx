"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import type { User } from "@supabase/supabase-js"

interface UserSubmissionsProps {
  user: User
}

interface Submission {
  id: string
  name: string
  phone: string
  address: string
  delivery_instructions: string
  total_cost?: number
  tip?: number
  image_urls: string[]
  created_at: string
}

export default function UserSubmissions({ user }: UserSubmissionsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("form_submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setSubmissions(data || [])
    } catch (err: any) {
      console.error("Error fetching submissions:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [user.id])

  if (loading) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-gray-600">
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
          <p className="text-gray-300">Loading orders...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-gray-600">
        <CardContent className="py-8 text-center">
          <p className="text-red-400 mb-4">Error loading orders: {error}</p>
          <Button
            onClick={fetchSubmissions}
            variant="outline"
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Your Orders</h2>
        <Button
          onClick={fetchSubmissions}
          variant="outline"
          size="sm"
          className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {submissions.length === 0 ? (
        <Card className="bg-black/40 backdrop-blur-xl border-gray-600">
          <CardContent className="py-8 text-center text-gray-400">
            No orders yet. Create your first order above!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {submissions.map((submission) => (
            <Card key={submission.id} className="bg-black/40 backdrop-blur-xl border-gray-600 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-white">{submission.name}</CardTitle>
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400">Phone: {submission.phone}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-200">Address:</h4>
                  <p className="text-gray-300">{submission.address}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-gray-200">Delivery Instructions:</h4>
                  <p className="text-gray-300">{submission.delivery_instructions}</p>
                </div>

                {submission.total_cost && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-200">Total Cost:</h4>
                    <p className="text-gray-300">${submission.total_cost.toFixed(2)}</p>
                  </div>
                )}

                {submission.tip && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-200">Tip:</h4>
                    <p className="text-gray-300">${submission.tip.toFixed(2)}</p>
                  </div>
                )}

                {submission.image_urls && submission.image_urls.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-gray-200">
                      Images ({submission.image_urls.length}):
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {submission.image_urls.map((imageUrl, index) => (
                        <img
                          key={index}
                          src={imageUrl || "/placeholder.svg"}
                          alt={`Order image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-600"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=128&width=128"
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
