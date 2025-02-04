import OpenAI, { APIError } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // apiKey: 'ERROR_TEST',
})

export async function fetchOpenAiStt(file: File) {
  try {
    if (!file) {
      throw new Error('No file provided for transcription.')
    }

    const response = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'json',
      language: 'en',
    })

    return response.text
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('An error occurred while fetching from OpenAI:', error)
      throw error
    } else {
      console.error('An unknown error occurred while fetching from OpenAI:', error)
      throw new Error('Unknown error occurred')
    }
  }
}

export function handleError(error: unknown) {
  if (error instanceof APIError) {
    return Response.json({ message: error.message, status: error.status }, { status: error.status })
  } else if (error instanceof Error) {
    console.error('An error occurred while fetching from OpenAI:', error)
    return Response.json({ message: error.message }, { status: 500 })
  } else {
    console.error('Unknown error occurred:', error)
    return Response.json({ message: 'Unknown error occurred' }, { status: 500 })
  }
}
