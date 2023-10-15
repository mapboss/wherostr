'use client'
import { MapContext } from '@/contexts/MapContext'
import { useContext, useMemo } from 'react'

export const useMap = () => {
  const { map } = useContext(MapContext)
  return useMemo(() => map, [map])
}
