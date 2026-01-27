'use server'

import * as yup from 'yup'
import { actionClient } from '@/lib/safe-action'
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly'

const polly = new PollyClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const F_VOICE_ID = 'Joanna'
const M_VOICE_ID = 'Matthew'

const pollySchema = yup.object().shape({
  text: yup.string().required(),
  voiceGender: yup.string().oneOf(['M', 'F']).default('F'),
})

// -- 3. Action: Synthesize Speech (Audio) --
export const synthesizeSpeechAction = actionClient
  .schema(pollySchema)
  .action(async ({ parsedInput: { text, voiceGender } }) => {
    try {
      const command = new SynthesizeSpeechCommand({
        OutputFormat: 'mp3',
        Text: text,
        LanguageCode: 'en-US',
        VoiceId: voiceGender === 'M' ? M_VOICE_ID : F_VOICE_ID,
        Engine: 'neural',
        TextType: 'text',
      })

      const response = await polly.send(command)

      if (!response.AudioStream) {
        throw new Error('No audio stream returned from AWS')
      }

      const byteArray = await response.AudioStream.transformToByteArray()
      const audioBase64 = Buffer.from(byteArray).toString('base64')

      return { success: true, audioBase64 }
    } catch (error) {
      console.error('Polly Audio Error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

export const getSpeechMarksAction = actionClient
  .schema(pollySchema)
  .action(async ({ parsedInput: { text, voiceGender } }) => {
    try {
      const command = new SynthesizeSpeechCommand({
        OutputFormat: 'json',
        Text: text,
        LanguageCode: 'en-US',
        VoiceId: voiceGender === 'M' ? M_VOICE_ID : F_VOICE_ID,
        Engine: 'neural',
        SpeechMarkTypes: ['viseme', 'word'],
      })

      const response = await polly.send(command)

      if (!response.AudioStream) {
        throw new Error('No audio stream returned from AWS')
      }

      const textData = await response.AudioStream.transformToString()

      const marks = textData
        .split('\n')
        .filter((line) => line)
        .map((line) => JSON.parse(line))

      return { success: true, marks }
    } catch (error) {
      console.error('Polly Marks Error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
