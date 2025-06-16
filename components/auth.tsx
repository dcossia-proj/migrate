"use client"

import type React from "react"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowRight, Mail, Lock, User, Phone } from "lucide-react"
import AnimatedBackground from "./animated-background"

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  // Form data
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")

  const createUserProfile = async (userId: string, name: string, phone: string) => {
    try {
      const response = await fetch("/api/create-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          fullName: name,
          phoneNumber: phone,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Failed to create profile")
      }
      return result
    } catch (error) {
      console.error("Error creating profile:", error)
      throw error
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!fullName.trim() || !phoneNumber.trim()) {
        throw new Error("Full name and phone number are required")
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        try {
          await createUserProfile(data.user.id, fullName.trim(), phoneNumber.trim())
          alert("Registration successful! Check your email for verification link, then sign in.")
        } catch (profileError: any) {
          alert(
            "Account created successfully! Check your email for verification link. Your profile will be created when you first sign in.",
          )
        }
      }

      // Reset form
      setEmail("")
      setPassword("")
      setFullName("")
      setPhoneNumber("")
      setCurrentStep(0)
      setIsSignUp(false)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (isSignUp) {
      if (currentStep < 3) setCurrentStep(currentStep + 1)
    } else {
      if (currentStep < 1) setCurrentStep(currentStep + 1)
    }
  }

  const canProceed = () => {
    if (currentStep === 0) return email.includes("@")
    if (currentStep === 1) return password.length >= 6
    if (currentStep === 2) return fullName.trim().length > 0
    if (currentStep === 3) return phoneNumber.trim().length > 0
    return false
  }

  const switchMode = () => {
    setIsSignUp(!isSignUp)
    setCurrentStep(0)
    setEmail("")
    setPassword("")
    setFullName("")
    setPhoneNumber("")
  }

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen flex items-center justify-center p-4 relative safe-top safe-bottom safe-left safe-right">
        <Card className="w-full max-w-md bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent drop-shadow-lg">
              Greysale
            </CardTitle>
            <CardDescription className="text-gray-200 drop-shadow-md">
              {isSignUp ? "Create your account" : "Welcome back"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-6">
              {/* Email Step */}
              <div
                className={`transition-all duration-500 ${currentStep >= 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                <Label htmlFor="email" className="text-gray-200 flex items-center gap-2 drop-shadow-md">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-gray-300 focus:border-white/40 focus:bg-white/15 transition-all duration-300"
                  required
                />
                {currentStep === 0 && canProceed() && (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="w-full mt-3 bg-gradient-to-r from-gray-700/80 to-gray-600/80 hover:from-gray-600/90 hover:to-gray-500/90 text-white backdrop-blur-sm shadow-lg transition-all duration-300"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>

              {/* Password Step */}
              {currentStep >= 1 && (
                <div
                  className={`transition-all duration-500 ${currentStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                >
                  <Label htmlFor="password" className="text-gray-200 flex items-center gap-2 drop-shadow-md">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-gray-300 focus:border-white/40 focus:bg-white/15 transition-all duration-300"
                    required
                  />
                  {currentStep === 1 && canProceed() && !isSignUp && (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-3 bg-gradient-to-r from-gray-700/80 to-gray-600/80 hover:from-gray-600/90 hover:to-gray-500/90 text-white backdrop-blur-sm shadow-lg transition-all duration-300"
                    >
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  )}
                  {currentStep === 1 && canProceed() && isSignUp && (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="w-full mt-3 bg-gradient-to-r from-gray-700/80 to-gray-600/80 hover:from-gray-600/90 hover:to-gray-500/90 text-white backdrop-blur-sm shadow-lg transition-all duration-300"
                    >
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              )}

              {/* Full Name Step (Sign Up Only) */}
              {isSignUp && currentStep >= 2 && (
                <div
                  className={`transition-all duration-500 ${currentStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                >
                  <Label htmlFor="fullName" className="text-gray-200 flex items-center gap-2 drop-shadow-md">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-gray-300 focus:border-white/40 focus:bg-white/15 transition-all duration-300"
                    required
                  />
                  {currentStep === 2 && canProceed() && (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="w-full mt-3 bg-gradient-to-r from-gray-700/80 to-gray-600/80 hover:from-gray-600/90 hover:to-gray-500/90 text-white backdrop-blur-sm shadow-lg transition-all duration-300"
                    >
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              )}

              {/* Phone Number Step (Sign Up Only) */}
              {isSignUp && currentStep >= 3 && (
                <div
                  className={`transition-all duration-500 ${currentStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                >
                  <Label htmlFor="phoneNumber" className="text-gray-200 flex items-center gap-2 drop-shadow-md">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-gray-300 focus:border-white/40 focus:bg-white/15 transition-all duration-300"
                    required
                  />
                  {currentStep === 3 && canProceed() && (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-3 bg-gradient-to-r from-gray-700/80 to-gray-600/80 hover:from-gray-600/90 hover:to-gray-500/90 text-white backdrop-blur-sm shadow-lg transition-all duration-300"
                    >
                      {loading ? "Creating Account..." : "Create Account"}
                    </Button>
                  )}
                </div>
              )}
            </form>

            <div className="text-center">
              <button
                onClick={switchMode}
                className="text-gray-200 hover:text-white transition-colors text-sm drop-shadow-md"
              >
                {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
