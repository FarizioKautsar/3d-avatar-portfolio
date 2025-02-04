'use client'

import React, { forwardRef, Suspense, useImperativeHandle, useRef, ReactNode } from 'react'
import { OrbitControls, PerspectiveCamera, useTexture, View as ViewImpl } from '@react-three/drei'
import { Three } from '@/helpers/components/Three'

interface CommonProps {
  color?: string
  fov?: number
}

export const Common: React.FC<CommonProps> = ({ color, fov = 40 }) => {
  const texture = useTexture('/textures/background.png')

  return (
    <Suspense fallback={null}>
      {/* {color && <color attach="background" args={[color]} />} */}
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 0, 30]} intensity={70} decay={1} />
      <pointLight position={[-30, 30, -30]} decay={100} intensity={10} />
      <pointLight position={[30, 10, -30]} color='#F8FAFC' decay={0.2} intensity={5} />
      <pointLight position={[-30, -10, -30]} color='#E2E8F0' decay={0.2} intensity={3} />
      {/* <pointLight position={[10, -10, 0]} color='cyan' decay={0.2} intensity={3} /> */}
      <PerspectiveCamera makeDefault fov={fov} position={[0, 0, 6]} />

      {/* <mesh position={[0, 0, -70]} scale={[10, 10, 1]}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial map={texture} />
      </mesh> */}
    </Suspense>
  )
}

interface ViewProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  orbit?: boolean
}

const View = forwardRef<HTMLDivElement, ViewProps>(({ children, orbit, ...props }, ref) => {
  const localRef = useRef<HTMLDivElement>(null)
  useImperativeHandle(ref, () => localRef.current)

  return (
    <>
      <div ref={localRef} {...props} />
      <Three>
        <ViewImpl track={localRef}>
          {children}
          {orbit && <OrbitControls />}
        </ViewImpl>
      </Three>
    </>
  )
})
View.displayName = 'View'

export { View }
