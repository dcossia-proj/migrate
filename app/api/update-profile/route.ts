import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Server-side Supabase client with service role (bypasses RLS)
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { userId, fullName, phoneNumber, address, deliveryInstructions } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("API: Updating profile for user:", userId)
    console.log("API: Update data:", { fullName, phoneNumber, address, deliveryInstructions })

    // Prepare the update data - only include fields that are provided
    const updateData: any = {
      id: userId,
      updated_at: new Date().toISOString(),
    }

    if (fullName) updateData.full_name = fullName
    if (phoneNumber) updateData.phone_number = phoneNumber
    if (address) updateData.address = address
    if (deliveryInstructions) updateData.delivery_instructions = deliveryInstructions

    console.log("API: Final update data:", updateData)

    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .upsert(updateData, {
        onConflict: "id",
      })
      .select()

    if (error) {
      console.error("API: Profile update error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("API: Profile updated successfully:", data)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("API: Unexpected error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
