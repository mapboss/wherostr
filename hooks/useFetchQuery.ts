'use client'
import {
  DependencyList,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import CancelablePromise from 'cancelable-promise'
import { AxiosError } from 'axios'

export function useFetchQuery<TInput = any, TOutput = any>(
  deps: DependencyList,
  fetchMethod: (
    payload?: TInput,
  ) => CancelablePromise<TOutput> | Promise<TOutput>,
  props?: {
    payload?: TInput
    disabled?: (() => boolean) | boolean
    onSuccess?: (result: TOutput) => void
    onError?: (error: unknown) => void
  },
) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TOutput>()
  const [error, setError] = useState<AxiosError>()
  const promiseRef = useRef<CancelablePromise<TOutput> | Promise<TOutput>>()
  const { disabled: disabledProps, onError, onSuccess, payload } = props || {}

  const disabled = useMemo(() => {
    if (disabledProps === true) return true
    if (typeof disabledProps === 'function' && disabledProps() === true)
      return true
    return false
  }, [disabledProps])

  const depList = Array.isArray(deps) ? [...deps, disabled] : [deps, disabled]

  const cancel =
    promiseRef.current && 'cancel' in promiseRef.current
      ? promiseRef.current.cancel
      : undefined

  const fetchData = useCallback(() => {
    setLoading(true)
    return fetchMethod(payload)
      .then<TOutput>((res: TOutput) => {
        setData(res)
        onSuccess?.(res)
        return res
      })
      .catch((err) => {
        setError(err)
        onError?.(err)
        return err
      })
      .finally(() => setLoading(false), true)
  }, [fetchMethod, payload, onError, onSuccess])

  useEffect(() => {
    if (disabled === true) return
    cancel?.()
    promiseRef.current = fetchData()
    return () =>
      promiseRef.current && 'cancel' in promiseRef.current
        ? promiseRef.current.cancel()
        : undefined
  }, depList)

  const reload = useCallback(() => {
    cancel?.()
    return fetchData()
  }, [fetchData])

  const mutate = useCallback((data: TOutput) => {
    return setData(data)
  }, [])

  return useMemo(() => {
    return { data, error, loading, disabled, reload, mutate }
  }, [data, error, loading, disabled, reload, mutate])
}
