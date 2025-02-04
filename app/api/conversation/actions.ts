'use server'

import * as yup from 'yup'
import { actionClient } from '@/lib/safe-action'
import { fetchFromOpenAi } from '../chatApi'
import OpenAI from 'openai'
import { fetchOpenAiStt } from '../sttApi'
import description from './description'

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
      let parsedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = messages.map((message) => ({
        role: message.role,
        content: message.content,
      }))
      parsedMessages = [
        {
          role: 'assistant',
          content: description,
        },
        {
          role: 'user',
          content:
            'Answer my question in at most 200 words. If I asked for anything else other than me, my CV, or portfolio, please kindly reject to answer.',
        },
        ...parsedMessages,
      ]
      const response = await fetchFromOpenAi(parsedMessages)
      const choice = response.choices?.[0]
      return { success: true, message: choice?.message }
    } catch (error) {
      console.error('OpenAI API error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
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
