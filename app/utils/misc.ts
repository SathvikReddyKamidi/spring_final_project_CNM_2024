import type { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import clsx from 'clsx'
import { OrderStatus } from '~/utils/prisma-enums'

export function round(number: number, precision: number) {
  const d = Math.pow(10, precision)
  return Math.round((number + Number.EPSILON) * d) / d
}

export function titleCase(string: string) {
  string = string.toLowerCase()
  const wordsArray = string.split(' ')

  for (let i = 0; i < wordsArray.length; i++) {
    wordsArray[i] =
      wordsArray[i].charAt(0).toUpperCase() + wordsArray[i].slice(1)
  }

  return wordsArray.join(' ')
}

export function formatList(list: Array<string>) {
  return new Intl.ListFormat('en').format(list)
}

export function formatTime(date: Date | string) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: 'numeric',
  }).format(new Date(date))
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
  const nameParts = name.split(/[^a-zA-Z]+/)
  let initials = ''

  for (const part of nameParts) {
    if (part.length > 0) {
      initials += part[0]
    }

    if (initials.length >= 2) {
      break
    }
  }

  return initials.toUpperCase()
}

export const orderStatusLabelLookup: Record<OrderStatus, string> = {
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
  DELIVERED: 'Delivered',
  ORDER_PLACED: 'Order Placed',
  PENDING: 'Pending',
  READY: 'Ready',
}

export function formatCurrency(
  amount: number,
  locale: string = 'en-US',
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount)
}
