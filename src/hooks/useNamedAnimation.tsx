import { useFBX } from '@react-three/drei'

export default function useNamedAnimation(path: string, name: string) {
  const { animations } = useFBX(path)
  animations[0].name = name
  return animations
}
