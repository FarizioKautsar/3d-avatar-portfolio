'use client'

import { useState, useRef, useEffect } from 'react'
import RecordRTC from 'recordrtc'
import { FaMicrophone } from 'react-icons/fa'
import { FaXmark } from 'react-icons/fa6'

type AudioRecorderProps = {
  isRecording?: boolean
  isInputFocused?: boolean
  onRecordingStop?: (blob: Blob) => void
  onRecordingStart?: () => void
  onRecordingCancel?: () => void
}

const AudioRecorder = ({
  onRecordingStop,
  onRecordingStart,
  onRecordingCancel,
  isRecording,
  isInputFocused,
}: AudioRecorderProps) => {
  const [volume, setVolume] = useState(0)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  const recorder = useRef<RecordRTC | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContext = useRef<AudioContext | null>(null)
  const analyser = useRef<AnalyserNode | null>(null)
  const dataArray = useRef<Uint8Array | null>(null)
  const silenceTimer = useRef<NodeJS.Timeout | null>(null)
  const recordStartTime = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      audioContext.current?.close()
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      recorder.current = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/webm',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        timeSlice: 1000, // Optional: Handle chunks in real-time
      })

      recordStartTime.current = Date.now()
      recorder.current.startRecording()
      onRecordingStart?.()

      setupAudioAnalysis(stream)
    } catch (error) {
      onRecordingCancel?.()
      alert(`Error accessing microphone: ${error.message}`)
      console.error('Error accessing microphone:', error)
    }
  }

  const setupAudioAnalysis = (stream: MediaStream) => {
    audioContext.current = new AudioContext()
    const source = audioContext.current.createMediaStreamSource(stream)
    analyser.current = audioContext.current.createAnalyser()
    analyser.current.fftSize = 512

    source.connect(analyser.current)
    dataArray.current = new Uint8Array(analyser.current.frequencyBinCount)

    detectSilence()
    analyzeVolume()
  }

  const analyzeVolume = () => {
    if (!analyser.current || !dataArray.current) return

    analyser.current.getByteFrequencyData(dataArray.current)
    const avgVolume = dataArray.current.reduce((a, b) => a + b, 0) / dataArray.current.length

    setVolume(avgVolume)

    requestAnimationFrame(analyzeVolume)
  }

  const detectSilence = () => {
    if (!analyser.current || !dataArray.current) return

    analyser.current.getByteFrequencyData(dataArray.current)
    const averageVolume = dataArray.current.reduce((a, b) => a + b, 0) / dataArray.current.length

    if (averageVolume < 10) {
      if (!silenceTimer.current) {
        silenceTimer.current = setTimeout(() => {
          stopRecording()
          silenceTimer.current = null
        }, 3000) // Stop after 3s of silence
      }
    } else {
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current)
        silenceTimer.current = null
      }
    }

    requestAnimationFrame(detectSilence)
  }

  const stopRecording = async () => {
    if (!recorder.current) return

    recorder.current.stopRecording(() => {
      const audioBlob = recorder.current!.getBlob()
      const duration = recordStartTime.current ? (Date.now() - recordStartTime.current) / 1000 : 0

      if (duration >= 1) {
        setAudioBlob(audioBlob)
        onRecordingStop?.(audioBlob)
        setAudioURL(URL.createObjectURL(audioBlob))
      }

      cleanup()
    })
  }

  const cancelRecording = () => {
    if (recorder.current && isRecording) {
      recorder.current.stopRecording()
    }

    onRecordingCancel?.()
    recordStartTime.current = null
    setAudioBlob(null)
    setAudioURL(null)
    cleanup()
  }

  const cleanup = () => {
    if (recorder.current) {
      recorder.current.destroy()
      recorder.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (audioContext.current) {
      audioContext.current.close()
      audioContext.current = null
    }
  }

  useEffect(() => {
    if (isRecording) {
      startRecording()
    } else {
      stopRecording()
    }
  }, [isRecording])

  useEffect(() => {
    if (isInputFocused) {
      cancelRecording()
    }
  }, [isInputFocused])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isRecording) {
        cancelRecording()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isRecording])

  return (
    <div className='flex flex-col items-center'>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`flex items-center justify-center rounded-full text-white transition-all ${isRecording ? 'size-24 bg-red-500 hover:bg-red-600' : 'size-12 bg-slate-500 hover:bg-slate-600'}`}
        style={{
          boxShadow: isRecording ? `0 0 ${Math.min(volume, 30)}px rgba(255, 0, 0, 0.8)` : 'none',
        }}
      >
        <FaMicrophone />
      </button>

      {isRecording && (
        <button onClick={cancelRecording} className='mt-6 text-white'>
          <FaXmark />
        </button>
      )}
    </div>
  )
}

export default AudioRecorder
