import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Server-side Supabase client with service role (bypasses RLS)
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { userId, fullName, phoneNumber } = await request.json()

    if (!userId || !fullName || !phoneNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("Creating profile for user:", userId)

    const { data, error } = await supabaseAdmin.from("user_profiles").upsert(
      {
        id: userId,
        full_name: fullName,
        phone_number: phoneNumber,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    )

    if (error) {
      console.error("Profile creation error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Profile created successfully")
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
