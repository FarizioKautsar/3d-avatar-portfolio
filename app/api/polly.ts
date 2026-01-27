'use client'

import { getSpeechMarksAction, synthesizeSpeechAction } from "./polly/actions"

export const synthesizeSpeech = async (text: string, voiceGender: 'M' | 'F' = 'F'): Promise<string> => {
  const result = await synthesizeSpeechAction({ text, voiceGender })

  if (!result?.data?.success || !result?.data?.audioBase64) {
    throw new Error(result?.data?.error || result?.serverError || 'Failed to generate speech')
  }

  const binaryString = window.atob(result.data.audioBase64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  const blob = new Blob([bytes], { type: 'audio/mp3' })
  
  return URL.createObjectURL(blob)
}

export const getSpeechMarks = async (text: string, voiceGender: 'M' | 'F' = 'F'): Promise<any[]> => {
  const result = await getSpeechMarksAction({ text, voiceGender })

  if (!result?.data?.success || !result?.data?.marks) {
    throw new Error(result?.data?.error || result?.serverError || 'Failed to fetch speech marks')
  }
  
  return result.data.marks
}
