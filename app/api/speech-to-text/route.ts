export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { fetchOpenAiStt } from '../sttApi'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    const transcription = await fetchOpenAiStt(file)

    return NextResponse.json({ success: true, transcription })
  } catch (error) {
    console.error('Speech-to-Text Error:', error)
    return NextResponse.json({ success: false, error: 'Transcription failed' }, { status: 500 })
  }
}
