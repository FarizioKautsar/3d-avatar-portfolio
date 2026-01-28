'use server'

import * as yup from 'yup'
import { actionClient } from '@/lib/safe-action'
import { fetchFromOpenAi } from '../chatApi'
import OpenAI from 'openai'
import description from './description'
import { fetchOpenAiStt } from '../sttApi'

const SYSTEM_PROMPT = `
${description}

---
CRITICAL INSTRUCTIONS FOR THE AI:
1. You are a helpful assistant representing Farizio Kautsar Heruzy.
2. TONE: Professional but friendly. You can be casually polite (e.g., "Sure thing!").
3. SCOPE: Answer questions ONLY related to Farizio, his CV, his portfolio, or his tech stack.
4. REFUSAL: If the user asks about general topics (e.g., "Write me a poem about trees", "Solve this math problem"), kindly refuse and redirect them to ask about Farizio.
5. LENGTH: Keep answers concise (under 200 words) unless specifically asked for a detailed explanation.
`

const openAiSchema = yup.object().shape({
  messages: yup
    .array()
    .of(
      yup.object().shape({
        role: yup.string().oneOf(['system', 'user', 'assistant']).required(),
        content: yup.string().required(),
      }),
    )
    .required('Messages array is required'),
})

type OpenAiData = yup.InferType<typeof openAiSchema>

export const callOpenAi = actionClient
  .schema(openAiSchema)
  .action(async ({ parsedInput: { messages } }: { parsedInput: OpenAiData }) => {
    try {
      const conversationHistory = messages
        .filter((m) => m.role !== 'system')
        .map((message) => ({
          role: message.role as 'user' | 'assistant',
          content: message.content,
        }))

      const parsedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        ...conversationHistory,
      ]

      const response = await fetchFromOpenAi(parsedMessages)
      const choice = response.choices?.[0]

      return {
        success: true,
        message: {
          content: choice?.message?.content || '',
          role: choice?.message?.role || 'assistant',
          refusal: choice?.message?.refusal || '',
        } satisfies OpenAI.Chat.Completions.ChatCompletionMessage,
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      return { success: false, error: 'Failed to generate response. Please try again.' }
    }
  })

const speechToTextSchema = yup.object().shape({
  file: yup.mixed().required('Audio file is required'),
})

type SpeechToTextData = yup.InferType<typeof speechToTextSchema>

export const speechToText = actionClient
  .schema(speechToTextSchema)
  .action(async ({ parsedInput: { file } }: { parsedInput: SpeechToTextData }) => {
    try {
      if (!file) {
        throw new Error('No file uploaded')
      }

      const transcription = await fetchOpenAiStt(file as File)

      return { success: true, transcription }
    } catch (error) {
      console.error('Speech-to-Text Error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
