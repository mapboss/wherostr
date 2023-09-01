'use client'
import { createContext, PropsWithChildren, useMemo, useState } from 'react'

export type MapType = maplibregl.Map
export interface MapContextValue<T = MapType> {
  map?: T
}

export interface MapContextFunction<T = MapType> {
  setMap?: (map?: T) => void
}

export type MapContextProps<T = MapType> = MapContextValue<T> &
  MapContextFunction<T>

const defaultValue: MapContextProps = {
  map: undefined,
  setMap: (map) => {},
}

export interface MapProviderProps<T = MapType>
  extends MapContextValue<T>,
    PropsWithChildren {}

export const MapContext = createContext<MapContextProps>(defaultValue)

export function MapContextProvider({ children, map: defaultMap }: MapProviderProps) {
  const [map, setMap] = useState<MapType | undefined>(defaultMap)
  const contextValue = useMemo<MapContextProps>(() => {
    return {
      ...defaultValue,
      map,
      setMap,
    }
  }, [map])

  return (
    <MapContext.Provider value={contextValue}>{children}</MapContext.Provider>
  )
}
