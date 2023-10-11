'use client'
import { AppContext } from '@/contexts/AppContext'
import { useContext, useMemo } from 'react'

export const useAction = () => {
  const { setProfileAction, setEventAction, eventAction, profileAction } =
    useContext(AppContext)
  return useMemo(() => {
    return { setProfileAction, setEventAction, eventAction, profileAction }
  }, [setProfileAction, setEventAction, eventAction, profileAction])
}
