export type Phoneme = {
  time: number
  type: 'word' | 'viseme'
  start?: number
  end?: number
  value: string
}

export type Phonemes = Phoneme[]

export type ChatBubbleType = {
  role: 'user' | 'assistant'
  content?: string
  loading?: boolean
  isError?: boolean
}

export type GLTFResult = GLTF & {
  nodes: {
    Wolf3D_Hair: THREE.SkinnedMesh
    Wolf3D_Outfit_Bottom: THREE.SkinnedMesh
    Wolf3D_Outfit_Footwear: THREE.SkinnedMesh
    Wolf3D_Outfit_Top: THREE.SkinnedMesh
    EyeLeft: THREE.SkinnedMesh
    EyeRight: THREE.SkinnedMesh
    Wolf3D_Head: THREE.SkinnedMesh
    Wolf3D_Teeth: THREE.SkinnedMesh
    Hips: THREE.Bone
  }
  materials: {
    Wolf3D_Hair: THREE.MeshStandardMaterial
    Wolf3D_Outfit_Bottom: THREE.MeshStandardMaterial
    Wolf3D_Outfit_Footwear: THREE.MeshStandardMaterial
    Wolf3D_Outfit_Top: THREE.MeshStandardMaterial
    Wolf3D_Eye: THREE.MeshStandardMaterial
    Wolf3D_Skin: THREE.MeshStandardMaterial
    Wolf3D_Teeth: THREE.MeshStandardMaterial
  }
  // animations: GLTFAction[]
}

export type AvatarProp = JSX.IntrinsicElements['group'] & {
  audioUrl?: string
  phonemes?: Phoneme[]
  isLoading?: boolean
  hasStarted?: boolean
  isRecording?: boolean
  isInitial?: boolean
  setShownCharIndex?: React.Dispatch<React.SetStateAction<number>>
  nodes?: GLTFResult['nodes']
  gender?: 'M' | 'F'
  audio: HTMLAudioElement
  onLoad?: () => void
  // audioRef: React.MutableRefObject<HTMLAudioElement>
}
