'use client'

import dynamic from 'next/dynamic'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getSpeechMarks, synthesizeSpeech } from './api/polly'
import { AvatarProp, ChatBubbleType } from '@/types'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { InferType, object, string } from 'yup'
import classNames from 'classnames'
import Button from '@/components/Button'
import { IoMdFemale, IoMdMale, IoMdSend } from 'react-icons/io'
import ChatBubble from '@/components/ChatBubble'
import { AnimatePresence, motion } from 'framer-motion'
import { initialPhonemesF } from '@/lib/initialPhonemesF'
import { callOpenAi } from './api/conversation/actions'
import { initialPhonemesM } from '@/lib/initialPhonemesM'
import { FaStop } from 'react-icons/fa'
import Image from 'next/image'
import MainLoader from '@/components/MainLoader'
import { MdOutlineDarkMode, MdOutlineLightMode } from 'react-icons/md'

const AudioRecorder = dynamic(() => import('@/components/AudioRecorder'), {
  ssr: false,
})
type QuestionFormType = InferType<typeof questionSchema>
const View = dynamic(() => import('@/components/canvas/View').then((mod) => mod.View), {
  ssr: false,
  loading: () => <MainLoader />,
})
const Common = dynamic(() => import('@/components/canvas/View').then((mod) => mod.Common), { ssr: false })
const Avatar = dynamic(() => import('@/components/Avatar').then((mod) => mod.Avatar), {
  ssr: false,
})

const questionSchema = object().shape({
  message: string().required(),
})

const MESSAGES_LIMIT = 15
const INITIAL_SPEECH_PATH = '/audios/greetingF.mp3'
const INITIAL_PHONEMES = initialPhonemesF

export default function Page() {
  const [shownCharIndex, setShownCharIndex] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const [phonemes, setPhonemes] = useState(INITIAL_PHONEMES)
  const [audioUrl, setAudioUrl] = useState(INITIAL_SPEECH_PATH)
  const [messages, setMessages] = useState<ChatBubbleType[]>([
    {
      role: 'assistant',
      content:
        "Hi there! My name is Zi! I'm a web developer based in Melbourne, Australia. Need cool techy stuff? I'm your IT guy! How can I help you today?",
    },
  ])
  const [isReplying, setIsReplying] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [assistantError, setAssistantError] = useState<Error | null>(null)
  const [userError, setUserError] = useState<Error | null>(null)
  const [gender, setGender] = useState<'M' | 'F'>('M')
  const [isInitial, setIsInitial] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  const [transcribingError, setTranscribingError] = useState<Error | null>(null)

  useEffect(() => {
    if (isInitial) {
      if (gender === 'M') {
        setPhonemes(initialPhonemesM)
        setAudioUrl('/audios/greetingM.mp3')
      } else {
        setPhonemes(initialPhonemesF)
        setAudioUrl('/audios/greetingF.mp3')
      }
    }
  }, [gender])

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [forceError, setForceError] = useState(true)

  const handleSynthesize = async (text: string, isRetry: boolean = false) => {
    const message = isRetry ? messages[messages.length - 1]?.content : text
    setIsSubmitting(true)
    setTranscribingError(null)
    try {
      // Get phoneme data
      const marks = await getSpeechMarks(message, gender)
      setPhonemes(marks)

      // Get audio
      const url = await synthesizeSpeech(message, gender)
      setAudioUrl(url)
    } catch (error) {
      setTranscribingError(new Error(error.message))
      console.error('Error synthesizing speech:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleScrollToBottom() {
    // if (bottomMessageRef.current) {
    //   bottomMessageRef.current.scrollIntoView({
    //     behavior: 'smooth',
    //     block: 'end',
    //   })
    // }
  }

  function handleScrollToDelayedBottom() {
    setTimeout(() => {
      handleScrollToBottom()
    }, 100)
  }

  const messagesCount = messages.filter((m) => m.role === 'user').length
  const hasReachedMessagesLimit = messagesCount >= MESSAGES_LIMIT

  const { register, handleSubmit, setValue } = useForm({
    resolver: yupResolver(questionSchema),
  })

  async function askQuestion(question: string, isRetry: boolean = false) {
    if (!hasReachedMessagesLimit) {
      setValue('message', '')
      const newMessage: ChatBubbleType = isRetry ? messages[messages.length - 1] : { content: question, role: 'user' }
      const newMessages = [...messages, ...(isRetry ? [] : [newMessage])]
      try {
        setIsReplying(true)
        setMessages((prev) => [...prev, ...(isRetry ? [] : [newMessage])])
        handleScrollToDelayedBottom()
        const res = await callOpenAi({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        })
        if (res.data?.message) {
          setMessages((prev) => {
            const newMsgs = [...prev, res.data.message]
            return newMsgs as ChatBubbleType[]
          })
          handleSynthesize(res.data.message.content)
        }
        handleScrollToDelayedBottom()
      } catch (e: any) {
        setAssistantError(new Error(e.message))
        console.error('Error asking question:', e)
        handleScrollToDelayedBottom()
      } finally {
        setIsReplying(false)
      }
    }
    // if (!hasReachedMessagesLimit) {
    // } else {
    //   setConfirmReset(true)
    // }
  }

  const handleRecordingStop = useCallback(
    async (blob: Blob) => {
      setUserError(null)
      setIsRecording(false)
      if (!blob) return

      const audioFile = new File([blob], 'recording.mpeg', { type: 'audio/mpeg' })

      const formData = new FormData()
      formData.append('file', audioFile)

      setIsTranscribing(true)

      try {
        const response = await fetch('/api/speech-to-text', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (data.success) {
          onSubmit({
            message: data.transcription,
          })
        } else {
          setUserError(new Error(data.error))
          console.error('Transcription failed:', data.error)
        }
      } catch (error) {
        setUserError(error)
        console.error('Error uploading file:', error)
      } finally {
        setIsTranscribing(false)
      }
    },
    [messages],
  )

  function onSubmit(data: QuestionFormType) {
    if (!isReplying) {
      setShownCharIndex(0)
      askQuestion(data.message)
      handleScrollToDelayedBottom()
    }
  }

  const isLoading = isSubmitting || isReplying || isTranscribing

  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [isInputFocused, setInputFocused] = useState(false)

  const isInputFocusedRef = useRef(false)
  useEffect(() => {
    isInputFocusedRef.current = isInputFocused
  }, [isInputFocused])

  useEffect(() => {
    const handleAudioEnd = () => {
      setIsPlaying(false)
      setShownCharIndex(999999)

      setIsRecording((prev) => {
        if (!prev && !isLoading && !isInputFocusedRef.current) {
          return true
        }
        return prev
      })

      setIsInitial(false)
    }

    const handleAudioPlay = () => {
      setShownCharIndex(0)
      setIsPlaying(true)
    }

    const handleAudioPause = () => {
      setShownCharIndex(999999)
      setIsPlaying(false)
      setIsInitial(false)
    }

    if (!audio) {
      const audioInstance = new Audio(audioUrl)

      audioInstance.addEventListener('ended', handleAudioEnd)
      audioInstance.addEventListener('play', handleAudioPlay)
      audioInstance.addEventListener('pause', handleAudioPause)

      setAudio(audioInstance)
    } else {
      audio.src = audioUrl
      audio.load()
    }
    return () => {
      if (audio) {
        audio.removeEventListener('ended', handleAudioEnd)
        audio.removeEventListener('play', handleAudioPlay)
        audio.removeEventListener('pause', handleAudioPause)
      }
    }
  }, [audioUrl, isLoading])

  useEffect(() => {
    if (hasStarted && !isInitial) {
      audio.src = audioUrl
      audio.play()
    }
  }, [audio, audioUrl, hasStarted])

  useEffect(() => {
    if (isRecording) {
      audio.pause()
      setShownCharIndex(999999)
    }
  }, [audio, isRecording])

  useEffect(() => {
    if (hasStarted) {
      audio.play()
    }
  }, [audio, hasStarted])

  const commonAvatarProp: AvatarProp = {
    audioUrl,
    phonemes,
    isLoading,
    hasStarted,
    isRecording,
    setShownCharIndex,
    audio,
    gender,
    isInitial,
  }

  function handleStop() {
    audio.pause()
    setIsRecording(false)
    setShownCharIndex(999999)
  }

  function handleRecordingCancel() {
    setIsRecording(false)
  }

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    handleResize() // Set initial value
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const filteredMessages = isMobile ? messages.slice(-2) : messages

  function handleRetryRecording() {
    setIsRecording(true)
    setIsTranscribing(false)
  }

  const [darkMode, setDarkMode] = useState(false)

  function toggleDarkMode() {
    setDarkMode((prevMode) => {
      const newMode = !prevMode
      if (newMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return newMode
    })
  }

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
      setDarkMode(true)
    }
  }, [])

  return (
    <div className='h-dvh'>
      <Suspense fallback={null}>
        <View className='relative h-dvh sm:w-full'>
          <Avatar onLoad={() => setHasLoaded(true)} {...commonAvatarProp} isMobile={isMobile} />
          <Common color={'#8e72c2'} fov={40} />
          {/* <OrbitControls /> */}
        </View>
        {hasLoaded ? (
          <>
            <div className='absolute right-4 top-4 z-50 text-right'>
              <p className='dark:text-white'>Made with ❤️ by</p>
              <a
                href='https://farizio.dev'
                target='_blank'
                rel='noreferrer'
                className='text-2xl font-bold dark:text-white'
              >
                Farizio.dev
              </a>
            </div>
            <div className='absolute left-4 top-4 z-50 md:bottom-4 md:left-auto md:right-4 md:top-auto'>
              <Button className='size-16' rounded onClick={toggleDarkMode}>
                {darkMode ? <MdOutlineLightMode size={36} /> : <MdOutlineDarkMode size={36} />}
              </Button>
            </div>

            <div className='fixed bottom-0 left-0 z-10 flex h-dvh w-screen flex-col justify-end rounded-lg p-4 md:w-1/2'>
              {hasStarted ? (
                <>
                  <div className='no-scrollbar flex h-full flex-col-reverse overflow-y-auto overflow-x-visible pb-12'>
                    <AnimatePresence initial={false}>
                      <AnimatePresence mode='popLayout'>
                        {' '}
                        {/* Ensures exiting elements are properly removed */}
                        {isTranscribing && (
                          <motion.div
                            key='transcribing'
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                            className='flex w-full justify-end'
                          >
                            <ChatBubble loading role='user' />
                          </motion.div>
                        )}
                        {isReplying && (
                          <motion.div
                            key='replying'
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                          >
                            <ChatBubble loading role='assistant' />
                          </motion.div>
                        )}
                        {assistantError && (
                          <motion.div
                            key='assistantError'
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                          >
                            <ChatBubble isError role='assistant' onRetry={() => askQuestion('', true)} />
                          </motion.div>
                        )}
                        {transcribingError && (
                          <motion.div
                            key='transcribingError'
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                          >
                            <ChatBubble isError role='assistant' onRetry={() => handleSynthesize('', true)} />
                          </motion.div>
                        )}
                        {userError && (
                          <motion.div
                            key='userError'
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                            className={classNames('flex w-full', 'justify-end')}
                          >
                            <ChatBubble isError role='user' onRetry={handleRetryRecording} />
                          </motion.div>
                        )}
                        {[...filteredMessages].reverse().map((chat, cIdx) => {
                          const isLast = cIdx === 0
                          const content =
                            isLast && chat.role === 'assistant' ? chat.content.slice(0, shownCharIndex) : chat.content
                          const loadingUser = chat.loading || (isLast && isTranscribing)
                          const loadingAssistant = chat.loading || (isLast && shownCharIndex === 0)

                          return (
                            <motion.div
                              key={chat.content} // Ensure each message has a stable key
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                              className={classNames(
                                'flex w-full',
                                chat.role === 'assistant' ? 'justify-start' : 'justify-end',
                              )}
                            >
                              <ChatBubble
                                {...chat}
                                loading={chat.role === 'assistant' ? loadingAssistant : loadingUser}
                              >
                                {content}
                              </ChatBubble>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </AnimatePresence>
                  </div>
                  <div className='absolute bottom-4 right-0 flex w-full gap-3 px-4'>
                    <div className='relative flex flex-1 gap-3 transition-all duration-300'>
                      <form onSubmit={handleSubmit(onSubmit)} className='flex w-full items-center gap-3'>
                        <input
                          {...register('message')}
                          placeholder='Ask me anything!'
                          className={classNames(
                            'bg-gray-50 border border-gray-300 w-full',
                            'text-gray-900 text-sm rounded-lg',
                            'focus:ring-blue-500 focus:border-blue-500',
                            'flex-1 p-2.5 dark:bg-gray-900',
                            'dark:border-gray-600 dark:placeholder-gray-400',
                            'dark:text-white dark:focus:ring-blue-500',
                            'dark:focus:border-blue-500',
                          )}
                          onFocus={() => setInputFocused(true)}
                        />
                        {isPlaying ? (
                          <Button className='size-12' rounded onClick={handleStop}>
                            <FaStop />
                          </Button>
                        ) : (
                          <Button
                            className='size-12'
                            rounded
                            type='submit'
                            disabled={Boolean(isLoading || assistantError || hasReachedMessagesLimit)}
                          >
                            <IoMdSend />
                          </Button>
                        )}
                        <div className='w-12'></div>
                      </form>
                      <motion.div
                        initial={{ right: '0%', bottom: 0, x: 0, y: 0 }}
                        animate={
                          isRecording
                            ? { height: '100dvh', right: '50%', bottom: '50%', x: '50%', y: '50%' }
                            : { height: '3rem', right: '0%', bottom: 0, x: 0, y: 0 }
                        }
                        transition={{ type: 'spring', stiffness: 100, damping: 15, duration: 0.15 }}
                        className='absolute'
                      >
                        <AudioRecorder
                          key={messages.length}
                          onRecordingStop={handleRecordingStop}
                          onRecordingStart={() => {
                            setIsRecording(true)
                            setInputFocused(false)
                          }}
                          isRecording={isRecording}
                          onRecordingCancel={handleRecordingCancel}
                          isInputFocused={isInputFocused}
                        />
                      </motion.div>
                    </div>
                  </div>
                </>
              ) : (
                <div className='flex h-full flex-col items-center justify-center gap-3'>
                  <h1 className='text-center text-3xl font-bold dark:text-white'>Hi! I&apos;m Zi, your IT guy!</h1>
                  <Button onClick={() => setHasStarted(true)}>Start Experience</Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className='fixed inset-0'>
            <MainLoader />
          </div>
        )}
      </Suspense>
    </div>
  )
}
