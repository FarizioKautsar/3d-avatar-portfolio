import { PollyClient, SynthesizeSpeechCommand, SynthesizeSpeechCommandOutput } from '@aws-sdk/client-polly'

const polly = new PollyClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIA3B7EPCGY6UJCCDJH',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '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',
  },
})

const F_VOICE_ID = 'Joanna'
const M_VOICE_ID = 'Matthew'

export const synthesizeSpeech = async (text: string, voiceGender: 'M' | 'F' = 'F'): Promise<string> => {
  const VoiceId = voiceGender === 'M' ? M_VOICE_ID : F_VOICE_ID
  const command = new SynthesizeSpeechCommand({
    OutputFormat: 'mp3',
    Text: text,
    LanguageCode: 'en-US',
    VoiceId,
    Engine: 'neural',
    TextType: 'text',
  })
  const response = await polly.send(command)

  if (!response.AudioStream) {
    throw new Error('AudioStream is undefined.')
  }

  const audioBuffer = await streamToBlob(response.AudioStream, 'audio/mp3')
  const audioUrl = URL.createObjectURL(audioBuffer)

  return audioUrl
}

export const getSpeechMarks = async (text: string, voiceGender: 'M' | 'F' = 'F'): Promise<any[]> => {
  const VoiceId = voiceGender === 'M' ? M_VOICE_ID : F_VOICE_ID
  const command = new SynthesizeSpeechCommand({
    OutputFormat: 'json',
    Text: text,
    LanguageCode: 'en-US',
    VoiceId,
    Engine: 'neural',
    SpeechMarkTypes: ['viseme', 'word'],
  })
  const response = await polly.send(command)

  if (!response.AudioStream) {
    throw new Error('AudioStream is undefined.')
  }

  const marksJson = await streamToString(response.AudioStream)

  return marksJson
    .split('\n')
    .filter((line) => line)
    .map((line) => JSON.parse(line))
}

const streamToBlob = async (stream: SynthesizeSpeechCommandOutput['AudioStream'], mimeType: string): Promise<Blob> => {
  if (typeof stream.transformToByteArray === 'function') {
    const byteArray = await stream.transformToByteArray()
    return new Blob([byteArray], { type: mimeType })
  }

  // const chunks: Uint8Array[] = []
  // const reader = stream.getReader()

  // while (true) {
  //   const { value, done } = await reader.read()
  //   if (done) break
  //   if (value) chunks.push(value)
  // }

  // return new Blob(chunks, { type: mimeType })
}

const streamToString = async (stream: SynthesizeSpeechCommandOutput['AudioStream']): Promise<string> => {
  if (typeof stream.transformToString === 'function') {
    return await stream.transformToString('utf-8')
  }
  throw new Error('Stream does not support transformToString')
}
