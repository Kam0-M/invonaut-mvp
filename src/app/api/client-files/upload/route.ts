// src/app/api/client-files/upload/route.ts
//
// Accepts multipart/form-data with:
//   file     — the file to upload
//   clientId — the client this file belongs to
//
// Uploads to Supabase Storage: client-files/{userId}/{clientId}/{timestamp}-{filename}
// Saves a record to the client_files table and returns it.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25 MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
    }

    const formData = await request.formData()
    const file     = formData.get('file') as File | null
    const clientId = formData.get('clientId') as string | null

    if (!file || !clientId) {
      return NextResponse.json({ success: false, error: 'Missing file or clientId' }, { status: 400 })
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ success: false, error: 'File must be under 25 MB' }, { status: 400 })
    }

    // Verify the client belongs to this user (RLS would also catch this, but better to fail early)
    const { data: clientCheck } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (!clientCheck) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 })
    }

    // Build a safe storage path
    const safeName = file.name.replace(/[^a-zA-Z0-9._\- ]/g, '_')
    const filePath = `${user.id}/${clientId}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('client-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      })

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    const { data: urlData } = supabase.storage
      .from('client-files')
      .getPublicUrl(filePath)

    // Save record to DB
    const { data: record, error: dbError } = await supabase
      .from('client_files')
      .insert({
        user_id:   user.id,
        client_id: clientId,
        file_name: file.name,
        file_url:  urlData.publicUrl,
        file_size: file.size,
        file_type: file.type || 'application/octet-stream',
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json(
        { success: false, error: `Database error: ${dbError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, file: record })
  } catch (err: any) {
    console.error('client-files/upload error:', err)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
