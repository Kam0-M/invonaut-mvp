// src/app/api/client-files/delete/route.ts
//
// Accepts JSON: { fileId: string }
// Looks up the file record, deletes from Supabase Storage, then removes the DB record.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
    }

    const { fileId } = await request.json()
    if (!fileId) {
      return NextResponse.json({ success: false, error: 'Missing fileId' }, { status: 400 })
    }

    // Look up file — RLS ensures only the owner can fetch it
    const { data: fileRecord, error: fetchError } = await supabase
      .from('client_files')
      .select('id, file_url, user_id')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !fileRecord) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 })
    }

    // Derive storage path from public URL
    // URL format: .../storage/v1/object/public/client-files/{path}
    const url       = fileRecord.file_url as string
    const marker    = '/client-files/'
    const markerIdx = url.indexOf(marker)
    if (markerIdx !== -1) {
      const storagePath = decodeURIComponent(url.slice(markerIdx + marker.length))
      const { error: storageError } = await supabase.storage
        .from('client-files')
        .remove([storagePath])

      if (storageError) {
        console.error('Storage delete error (non-fatal):', storageError.message)
        // Continue — still delete the DB record even if storage delete fails
      }
    }

    // Delete DB record
    const { error: dbError } = await supabase
      .from('client_files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', user.id)

    if (dbError) {
      return NextResponse.json(
        { success: false, error: `Database error: ${dbError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('client-files/delete error:', err)
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
