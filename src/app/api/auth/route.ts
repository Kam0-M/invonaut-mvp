import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // TODO: Implement authentication logic with Supabase
    console.log('Login attempt:', { email, password })

    // Mock response for now
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: '1',
        email: email,
        name: 'John Doe'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 400 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Auth endpoint' })
}
