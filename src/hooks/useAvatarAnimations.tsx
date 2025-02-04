import { AvatarProp } from '@/types'
import { useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { RefObject, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import useFBXAnimation from './useFbxAnimation'

const corresponding = {
  u: 'viseme_U',
  e: 'viseme_E',
  O: 'viseme_O',
  S: 'viseme_CH',
  f: 'viseme_FF',
  a: 'viseme_aa',
  i: 'viseme_I',
  s: 'viseme_SS',
  p: 'viseme_PP',
  o: 'viseme_O',
  k: 'viseme_kk',
  E: 'viseme_E',
  sil: 'viseme_sil',
  t: 'viseme_TH',
}

export default function useAvatarAnimations({
  phonemes,
  isLoading,
  hasStarted,
  setShownCharIndex,
  gender,
  nodes,
  audio,
  isInitial,
  groupRef,
}: AvatarProp & { groupRef: RefObject<THREE.Group | null> }) {
  const smoothMorphTarget = true
  const morphTargetSmoothing = 0.5

  const visemes = phonemes.filter((phoneme) => phoneme.type === 'viseme')
  const words = phonemes.filter((phoneme) => phoneme.type === 'word')

  const [framePaused, setFramePaused] = useState(false)

  const mouthOpenValue = 1

  // MAIN ANIMATIONS
  useFrame(() => {
    // RESET THE MOUTH
    Object.values(corresponding).forEach((value) => {
      if (!smoothMorphTarget) {
        nodes.Wolf3D_Head.morphTargetInfluences[nodes.Wolf3D_Head.morphTargetDictionary[value]] = 0
        nodes.Wolf3D_Teeth.morphTargetInfluences[nodes.Wolf3D_Teeth.morphTargetDictionary[value]] = 0
      } else {
        nodes.Wolf3D_Head.morphTargetInfluences[nodes.Wolf3D_Head.morphTargetDictionary[value]] = THREE.MathUtils.lerp(
          nodes.Wolf3D_Head.morphTargetInfluences[nodes.Wolf3D_Head.morphTargetDictionary[value]],
          0,
          morphTargetSmoothing,
        )

        nodes.Wolf3D_Teeth.morphTargetInfluences[nodes.Wolf3D_Teeth.morphTargetDictionary[value]] =
          THREE.MathUtils.lerp(
            nodes.Wolf3D_Teeth.morphTargetInfluences[nodes.Wolf3D_Teeth.morphTargetDictionary[value]],
            0,
            morphTargetSmoothing,
          )
      }
    })

    if (framePaused) return

    const currentAudioTime = audio.currentTime * 1000
    if (currentAudioTime >= audio.duration * 1000) {
      setFramePaused(true)
      return
    }

    if (audio.paused) return

    for (const wordIdx in words) {
      const word = words[wordIdx]
      const start = word.time
      const end = word[wordIdx + 1]?.time || audio.duration * 1000
      if (currentAudioTime >= start && currentAudioTime <= end) {
        setShownCharIndex(word.end)
      }
    }

    for (let i = 0; i < visemes.length; i++) {
      const mouthCue = visemes[i]

      const start = mouthCue.time
      const end = visemes[i + 1]?.time || audio.duration * 1000
      if (currentAudioTime >= start && currentAudioTime <= end) {
        if (!smoothMorphTarget) {
          nodes.Wolf3D_Head.morphTargetInfluences[
            nodes.Wolf3D_Head.morphTargetDictionary[corresponding[mouthCue.value]]
          ] = mouthOpenValue
          nodes.Wolf3D_Teeth.morphTargetInfluences[
            nodes.Wolf3D_Teeth.morphTargetDictionary[corresponding[mouthCue.value]]
          ] = mouthOpenValue
        } else {
          nodes.Wolf3D_Head.morphTargetInfluences[
            nodes.Wolf3D_Head.morphTargetDictionary[corresponding[mouthCue.value]]
          ] = THREE.MathUtils.lerp(
            nodes.Wolf3D_Head.morphTargetInfluences[
              nodes.Wolf3D_Head.morphTargetDictionary[corresponding[mouthCue.value]]
            ],
            mouthOpenValue,
            morphTargetSmoothing,
          )
          nodes.Wolf3D_Teeth.morphTargetInfluences[
            nodes.Wolf3D_Teeth.morphTargetDictionary[corresponding[mouthCue.value]]
          ] = THREE.MathUtils.lerp(
            nodes.Wolf3D_Teeth.morphTargetInfluences[
              nodes.Wolf3D_Teeth.morphTargetDictionary[corresponding[mouthCue.value]]
            ],
            mouthOpenValue,
            morphTargetSmoothing,
          )
        }
      }

      // Reset morph targets for eyes
      nodes.EyeLeft.morphTargetInfluences.fill(0)
      nodes.EyeRight.morphTargetInfluences.fill(0)
    }
  })

  useEffect(() => {
    if (hasStarted) {
      setFramePaused(false)
    }
  }, [hasStarted])

  useEffect(() => {
    setFramePaused(false)
  }, [audio.src])

  const fIdleAnimation = useFBXAnimation('F_Idle')
  const fGreetingAnimation = useFBXAnimation('F_Greeting')
  const fThinkingAnimation = useFBXAnimation('F_Thinking')
  const mIdleAnimation = useFBXAnimation('M_Idle')
  const mSaluteAnimation = useFBXAnimation('M_Salute')

  const combinedAnimations = useMemo(
    () => [fIdleAnimation, fGreetingAnimation, fThinkingAnimation, mIdleAnimation, mSaluteAnimation],
    [fGreetingAnimation, fIdleAnimation, fThinkingAnimation, mIdleAnimation, mSaluteAnimation],
  )

  const { actions } = useAnimations(combinedAnimations, groupRef)

  const IDLE_ANIMATION_NAME = gender === 'M' ? 'M_Idle' : 'F_Idle'
  const GREETING_ANIMATION_NAME = gender === 'M' ? 'M_Salute' : 'F_Greeting'
  const THINKING_ANIMATION_NAME = 'F_Thinking'

  const [animation, setAnimation] = useState<'F_Idle' | 'F_Greeting' | 'F_Thinking' | 'M_Idle' | 'M_Salute'>(
    IDLE_ANIMATION_NAME,
  )

  useEffect(() => {
    if (actions[animation] && groupRef.current) {
      actions[animation].reset().fadeIn(0.5).play()
      return () => {
        if (actions[animation]) {
          actions[animation].fadeOut(0.5)
        }
      }
    }
  }, [animation, actions, groupRef])

  useEffect(() => {
    if (gender === 'M') {
      setAnimation('M_Idle')
    } else {
      setAnimation('F_Idle')
    }
  }, [gender])

  useEffect(() => {
    if (isLoading) {
      setAnimation(THINKING_ANIMATION_NAME)
    } else {
      setAnimation(IDLE_ANIMATION_NAME)
    }
  }, [IDLE_ANIMATION_NAME, isLoading])

  useEffect(() => {
    if (hasStarted && isInitial) {
      setAnimation(GREETING_ANIMATION_NAME)
    } else {
      setAnimation(IDLE_ANIMATION_NAME)
    }
  }, [GREETING_ANIMATION_NAME, IDLE_ANIMATION_NAME, hasStarted, isInitial])

  useFrame((state) => {
    if (groupRef.current) {
      const head = groupRef.current.getObjectByName('Head')
      head.lookAt(state.camera.position)
      head.rotation.x += 0.1 // Adjust this value to control how much the head looks down
    }
  })

  // BLINKING
  const blinkIntervalMin = 3 // Min time between blinks (seconds)
  const blinkIntervalMax = 6 // Max time between blinks (seconds)
  const blinkSpeed = 0.5 // Speed of each blink
  const closedDuration = 0.05 // How long eyes stay closed

  const [blinkProgress, setBlinkProgress] = useState(0)
  const [isBlinking, setIsBlinking] = useState(false)

  useEffect(() => {
    const interval = setTimeout(
      () => {
        setIsBlinking(true)
        setBlinkProgress(1) // Instantly close eyes

        setTimeout(() => {
          setIsBlinking(false)
          setBlinkProgress(0) // Reset to open
        }, closedDuration * 1000)
      },
      Math.random() * (blinkIntervalMax - blinkIntervalMin) + blinkIntervalMin * 1000,
    )

    return () => clearTimeout(interval)
  }, [isBlinking])

  // Open Eye Animation
  useFrame((_, delta) => {
    if (!nodes.Wolf3D_Head.morphTargetDictionary['eyesClosed']) return

    nodes.Wolf3D_Head.morphTargetInfluences[nodes.Wolf3D_Head.morphTargetDictionary['eyesClosed']] =
      THREE.MathUtils.lerp(
        nodes.Wolf3D_Head.morphTargetInfluences[nodes.Wolf3D_Head.morphTargetDictionary['eyesClosed']],
        blinkProgress,
        blinkSpeed,
      )
  })

  nodes.Wolf3D_Head.morphTargetInfluences[nodes.Wolf3D_Head.morphTargetDictionary['mouthSmile']] = 0.5

  // Close Eye Animation (instant)
  useFrame(() => {
    if (!nodes.EyeLeft.morphTargetDictionary['eyesClosed']) return

    // Force eyes closed
    nodes.EyeLeft.morphTargetInfluences[nodes.EyeLeft.morphTargetDictionary['eyesClosed']] = 1
    nodes.EyeRight.morphTargetInfluences[nodes.EyeRight.morphTargetDictionary['eyesClosed']] = 1
  })
  return groupRef
}
