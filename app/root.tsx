import { ColorSchemeScript, MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import type { LoaderFunctionArgs, SerializeFrom } from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  Links,
  Meta,
  MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from '@remix-run/react'
import { CartProvider } from './context/CartContext'
import { getUser } from './lib/session.server'
import '~/styles/tailwind.css'

import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'

import ErrorScreen from '~/components/ErrorBoundary'

export type RootLoaderData = SerializeFrom<typeof loader>
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request)
  return json({ user })
}

export const meta: MetaFunction = () => {
  return [{ title: 'ICS' }, { name: 'description', content: 'Ice Cream Shop' }]
}

export function Document({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {title ? <title>{title}</title> : null}
        <Meta />
        <Links />
        <ColorSchemeScript />
      </head>
      <body className="h-full">
        <MantineProvider defaultColorScheme="light">
          <ModalsProvider>
            <Notifications />
            <CartProvider>{children}</CartProvider>
          </ModalsProvider>
        </MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return (
    <Document>
      <Outlet />
    </Document>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <Document>
        <ErrorScreen error={error.statusText} />
      </Document>
    )
  } else if (error instanceof Error) {
    return (
      <Document>
        <ErrorScreen error={error.message} />
      </Document>
    )
  } else {
    return <h1>Unknown Error</h1>
  }
}
