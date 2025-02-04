import * as THREE from 'three'
import React, { useEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useGraph } from '@react-three/fiber'
import { GLTF, SkeletonUtils } from 'three-stdlib'
import useAvatarAnimations from '@/hooks/useAvatarAnimations'
import { AvatarProp } from '@/types'

type GLTFResult = GLTF & {
  nodes: {
    Wolf3D_Body: THREE.SkinnedMesh
    Wolf3D_Hair: THREE.SkinnedMesh
    Wolf3D_Outfit_Bottom: THREE.SkinnedMesh
    Wolf3D_Glasses: THREE.SkinnedMesh
    Wolf3D_Outfit_Footwear: THREE.SkinnedMesh
    Wolf3D_Outfit_Top: THREE.SkinnedMesh
    EyeLeft: THREE.SkinnedMesh
    EyeRight: THREE.SkinnedMesh
    Wolf3D_Head: THREE.SkinnedMesh
    Wolf3D_Teeth: THREE.SkinnedMesh
    Hips: THREE.Bone
  }
  materials: {
    Wolf3D_Body?: THREE.MeshStandardMaterial
    Wolf3D_Hair?: THREE.MeshStandardMaterial
    Wolf3D_Glasses: THREE.MeshStandardMaterial
    Wolf3D_Outfit_Bottom?: THREE.MeshStandardMaterial
    Wolf3D_Outfit_Footwear?: THREE.MeshStandardMaterial
    Wolf3D_Outfit_Top?: THREE.MeshStandardMaterial
    Wolf3D_Eye?: THREE.MeshStandardMaterial
    Wolf3D_Skin?: THREE.MeshStandardMaterial
    Wolf3D_Teeth?: THREE.MeshStandardMaterial
    [key: string]: THREE.MeshStandardMaterial // Allow dynamic material names
  }
}

function AvatarInner({ gender, onLoad, ...props }: AvatarProp) {
  useEffect(() => {
    onLoad()
  }, [])

  const maleModel = useGLTF('/models/zi_final.glb')
  const femaleModel = useGLTF('/models/final_f.glb')

  const selectedModel = useMemo(() => {
    return gender === 'M' ? SkeletonUtils.clone(maleModel.scene) : SkeletonUtils.clone(femaleModel.scene)
  }, [gender, maleModel, femaleModel])

  const graph = useGraph(selectedModel) as GLTFResult
  const { nodes, materials } = graph

  const materialMapping = useMemo(() => {
    return Object.keys(materials).reduce((acc, key) => {
      const cleanKey = key.replace(/\.\d+$/, '') // Removes any ".001", ".004", etc.
      acc[cleanKey] = materials[key]
      return acc
    }, {})
  }, [materials]) as GLTFResult['materials']

  const groupRef = useRef<THREE.Group | null>(null)

  useAvatarAnimations({ ...props, gender, nodes, groupRef })

  return (
    <group {...props} dispose={null} ref={groupRef}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        geometry={nodes.Wolf3D_Body.geometry}
        material={materialMapping.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Hair.geometry}
        material={materialMapping.Wolf3D_Hair}
        skeleton={nodes.Wolf3D_Hair.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Glasses.geometry}
        material={materials.Wolf3D_Glasses}
        skeleton={nodes.Wolf3D_Glasses.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materialMapping.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materialMapping.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materialMapping.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
      <skinnedMesh
        name='EyeLeft'
        geometry={nodes.EyeLeft.geometry}
        material={materialMapping.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name='EyeRight'
        geometry={nodes.EyeRight.geometry}
        material={materialMapping.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name='Wolf3D_Head'
        geometry={nodes.Wolf3D_Head.geometry}
        material={materialMapping.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name='Wolf3D_Teeth'
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materialMapping.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
    </group>
  )
}

export function Avatar({
  gender,
  isMobile,
  ...props
}: AvatarProp & {
  isMobile?: boolean
}) {
  const key = useMemo(() => gender, [gender]) // Create a key based on gender

  const xOffset = isMobile ? 0 : 0.3
  const scale = isMobile ? 1 : 1.4
  const yOffset = isMobile ? (gender === 'M' ? -1.6 : -1.5) : gender === 'M' ? -2.3 : -2.15

  return <AvatarInner key={key} position={[xOffset, yOffset, 5]} scale={scale} gender={gender} {...props} />
}

useGLTF.preload('/models/zi_final.glb')
