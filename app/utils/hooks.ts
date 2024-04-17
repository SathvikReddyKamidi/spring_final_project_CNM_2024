import { useRouteLoaderData } from '@remix-run/react'
import * as React from 'react'
import type { RootLoaderData } from '~/root'
import { AppLoaderData } from '~/routes/_app+/_layout'

export function useOptionalUser() {
  return useRouteLoaderData('root') as RootLoaderData
}

export function useAppData() {
  return useRouteLoaderData('routes/_app+/_layout') as AppLoaderData
}

type ReturnType<T> = [T, React.Dispatch<React.SetStateAction<T>>]
export function useLocalStorageState<T>({
  key,
  defaultValue,
}: {
  key: string
  defaultValue: T
}): ReturnType<T> {
  const [value, setValue] = React.useState<T>(defaultValue)

  React.useEffect(() => {
    const localStorageValue = window.localStorage.getItem(key)

    if (!localStorageValue) {
      setValue(defaultValue)
      return
    }

    setValue(JSON.parse(localStorageValue))
  }, [])

  React.useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

export function useUser() {
  const { user } = useOptionalUser()

  if (!user) throw new Error('No user found')

  return user
}
