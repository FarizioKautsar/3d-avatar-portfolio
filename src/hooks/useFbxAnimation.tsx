import { useFBX } from '@react-three/drei'
import { useMemo } from 'react'

const useFBXAnimation = (animationName: string) => {
  // Load the animation from the /animations folder
  const { animations } = useFBX(`/animations/${animationName}.fbx`)

  // Set the name of the animation
  const processedAnimation = useMemo(() => {
    if (animations && animations.length > 0) {
      animations[0].name = animationName
    }
    return animations
  }, [animations, animationName])

  return processedAnimation[0]
}

export default useFBXAnimation
