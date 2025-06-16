"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Upload,
  X,
  ArrowRight,
  ArrowLeft,
  User,
  Phone,
  MapPin,
  MessageSquare,
  DollarSign,
  Camera,
  Receipt,
} from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface SubmissionFormProps {
  user: SupabaseUser
}

interface UserProfile {
  full_name?: string
  phone_number?: string
  address?: string
  delivery_instructions?: string
}

export default function SubmissionForm({ user }: SubmissionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [deliveryInstructions, setDeliveryInstructions] = useState("")
  const [totalCost, setTotalCost] = useState("")
  const [tip, setTip] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const steps = [
    { title: "Your Name", icon: User, field: "name" },
    { title: "Phone Number", icon: Phone, field: "phone" },
    { title: "Delivery Address", icon: MapPin, field: "address" },
    { title: "Delivery Instructions", icon: MessageSquare, field: "instructions" },
    { title: "Total Cost", icon: Receipt, field: "totalCost" },
    { title: "Tip Amount", icon: DollarSign, field: "tip" },
    { title: "Cart Photos", icon: Camera, field: "images" },
  ]

  // Auto-calculate tip when total cost changes
  useEffect(() => {
    if (totalCost && !isNaN(Number.parseFloat(totalCost))) {
      const cost = Number.parseFloat(totalCost)
      const calculatedTip = (cost * 0.15).toFixed(2)
      setTip(calculatedTip)
    } else {
      setTip("")
    }
  }, [totalCost])

  // Load user profile data on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setProfileLoading(true)
        const { data, error } = await supabase
          .from("user_profiles")
          .select("full_name, phone_number, address, delivery_instructions")
          .eq("id", user.id)
          .maybeSingle()

        if (error) {
          console.error("Error loading user profile:", error)
          return
        }

        if (data) {
          if (data.full_name) setName(data.full_name)
          if (data.phone_number) setPhone(data.phone_number)
          if (data.address) setAddress(data.address)
          if (data.delivery_instructions) setDeliveryInstructions(data.delivery_instructions)
        }
      } catch (error) {
        console.error("Error loading user profile:", error)
      } finally {
        setProfileLoading(false)
      }
    }

    loadUserProfile()
  }, [user.id])

  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    try {
      console.log("Updating user profile via API with:", profileData)
      console.log("User ID:", user.id)

      const requestBody = {
        userId: user.id,
        fullName: profileData.full_name,
        phoneNumber: profileData.phone_number,
        address: profileData.address,
        deliveryInstructions: profileData.delivery_instructions,
      }

      console.log("Request body:", requestBody)

      const response = await fetch("/api/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("Response status:", response.status)
      const result = await response.json()
      console.log("Response data:", result)

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: Failed to update profile`)
      }

      console.log("Profile updated successfully via API:", result)
      return result
    } catch (error) {
      console.error("Error updating profile via API:", error)
      throw error
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles((prev) => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const sendToDiscord = async (submissionData: any) => {
    try {
      const response = await fetch("/api/discord-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      })

      if (!response.ok) {
        console.error("Failed to send to Discord:", await response.text())
      }
    } catch (error) {
      console.error("Discord webhook error:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (!name.trim() || !phone.trim() || !address.trim() || !deliveryInstructions.trim() || !totalCost.trim()) {
        throw new Error("All fields except tip are required")
      }

      if (selectedFiles.length < 2) {
        throw new Error("Please upload at least 2 pictures")
      }

      if (isNaN(Number.parseFloat(totalCost))) {
        throw new Error("Total cost must be a valid number")
      }

      if (tip && isNaN(Number.parseFloat(tip))) {
        throw new Error("Tip must be a valid number")
      }

      const imageUrls: string[] = []

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const fileExt = file.name.split(".").pop()
        const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("form-images")
          .upload(fileName, file)

        if (uploadError) {
          throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`)
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("form-images").getPublicUrl(fileName)

        imageUrls.push(publicUrl)
      }

      const { data, error } = await supabase
        .from("form_submissions")
        .insert({
          user_id: user.id,
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          delivery_instructions: deliveryInstructions.trim(),
          total_cost: Number.parseFloat(totalCost),
          tip: tip ? Number.parseFloat(tip) : null,
          image_urls: imageUrls,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      // Update user profile with ALL current form values
      console.log("Updating user profile after successful submission...")
      try {
        const profileUpdateResult = await updateUserProfile({
          full_name: name.trim(),
          phone_number: phone.trim(),
          address: address.trim(),
          delivery_instructions: deliveryInstructions.trim(),
        })
        console.log("✅ Profile updated successfully after order submission:", profileUpdateResult)
      } catch (profileError: any) {
        console.error("❌ Failed to update profile after submission:", profileError)
        // Show a more user-friendly message but don't block the redirect
        console.warn("Order was submitted successfully, but profile update failed. This won't affect your order.")
      }

      await sendToDiscord({
        name,
        phone,
        address,
        deliveryInstructions,
        totalCost: Number.parseFloat(totalCost),
        tip: tip ? Number.parseFloat(tip) : null,
        imageUrls,
        userId: user.id,
        userEmail: user.email,
        submittedAt: new Date().toISOString(),
      })

      router.push(`/thank-you?userId=${user.id}`)
    } catch (error: any) {
      console.error("Error submitting order:", error)
      setMessage({ type: "error", text: error.message || "An error occurred while submitting the order" })
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return name.trim().length > 0
      case 1:
        return phone.trim().length > 0
      case 2:
        return address.trim().length > 0
      case 3:
        return deliveryInstructions.trim().length > 0
      case 4:
        return totalCost.trim().length > 0 && !isNaN(Number.parseFloat(totalCost))
      case 5:
        return true // Tip is optional
      case 6:
        return selectedFiles.length >= 2
      default:
        return false
    }
  }

  if (profileLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-black/40 backdrop-blur-xl border-gray-600">
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
          <p className="text-gray-300">Loading your information...</p>
        </CardContent>
      </Card>
    )
  }

  const currentStepData = steps[currentStep]
  const Icon = currentStepData.icon

  return (
    <Card className="w-full max-w-2xl mx-auto bg-black/40 backdrop-blur-xl border-gray-600 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
          <Icon className="w-6 h-6 text-gray-300" />
          {currentStepData.title}
        </CardTitle>
        <CardDescription className="text-gray-300">
          Step {currentStep + 1} of {steps.length}
        </CardDescription>
        <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
          <div
            className="bg-gradient-to-r from-gray-500 to-gray-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 0: Name */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <Label htmlFor="name" className="text-gray-200">
                Name for this specific order?
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400 text-lg py-3"
                required
                autoFocus
              />
            </div>
          )}

          {/* Step 1: Phone */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Label htmlFor="phone" className="text-gray-200">
                What's your phone number?
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400 text-lg py-3"
                required
                autoFocus
              />
            </div>
          )}

          {/* Step 2: Address */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Label htmlFor="address" className="text-gray-200">
                Where should we deliver?
              </Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your full address including street, city, state, and zip code"
                rows={4}
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400 text-lg"
                required
                autoFocus
              />
            </div>
          )}

          {/* Step 3: Delivery Instructions */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Label htmlFor="delivery-instructions" className="text-gray-200">
                Any special delivery instructions?
              </Label>
              <Textarea
                id="delivery-instructions"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="Enter any special delivery instructions"
                rows={4}
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400 text-lg"
                required
                autoFocus
              />
            </div>
          )}

          {/* Step 4: Total Cost */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <Label htmlFor="total-cost" className="text-gray-200">
                What's the total cost of your order?
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">$</span>
                <Input
                  id="total-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  placeholder="0.00"
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400 text-lg py-3 pl-8"
                  required
                  autoFocus
                />
              </div>
              {totalCost && !isNaN(Number.parseFloat(totalCost)) && (
                <p className="text-sm text-gray-400">
                  Suggested tip (15%): ${(Number.parseFloat(totalCost) * 0.15).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Step 5: Tip */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <Label htmlFor="tip" className="text-gray-200">
                Tip amount (auto-calculated at 15%)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">$</span>
                <Input
                  id="tip"
                  type="number"
                  step="0.01"
                  min="0"
                  value={tip}
                  onChange={(e) => setTip(e.target.value)}
                  placeholder="0.00"
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gray-400 text-lg py-3 pl-8"
                  autoFocus
                />
              </div>
              <p className="text-sm text-gray-400">
                {totalCost && !isNaN(Number.parseFloat(totalCost)) ? (
                  <>
                    Order total: ${Number.parseFloat(totalCost).toFixed(2)} • Suggested tip (15%): $
                    {(Number.parseFloat(totalCost) * 0.15).toFixed(2)}
                  </>
                ) : (
                  "Tip is optional and can be adjusted"
                )}
              </p>
            </div>
          )}

          {/* Step 6: Images */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <Label htmlFor="images" className="text-gray-200">
                Upload photos of your cart and total (minimum 2)
              </Label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center bg-gray-800/30">
                <input
                  id="images"
                  name="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="images" className="cursor-pointer">
                  <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-300 text-lg">Click to upload pictures</p>
                  <p className="text-gray-500 text-sm mt-2">Minimum 2 pictures required</p>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-6">
                  <p className="text-gray-200 font-medium mb-3">Selected files ({selectedFiles.length}):</p>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-800/50 p-3 rounded border border-gray-600"
                      >
                        <span className="text-gray-300 truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            {currentStep > 0 && (
              <Button
                type="button"
                onClick={prevStep}
                variant="outline"
                className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}

            <div className="ml-auto">
              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white disabled:opacity-50"
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || !canProceed()}
                  className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white disabled:opacity-50"
                >
                  {loading ? "Submitting Order..." : "Submit Order"}
                </Button>
              )}
            </div>
          </div>
        </form>

        {message && (
          <div
            className={`mt-4 p-4 rounded-md ${message.type === "success" ? "bg-green-900/50 text-green-200 border border-green-700" : "bg-red-900/50 text-red-200 border border-red-700"}`}
          >
            {message.text}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
