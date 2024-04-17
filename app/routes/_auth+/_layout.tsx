import type { DataFunctionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { Outlet } from '@remix-run/react'
import { getUser } from '~/lib/session.server'

export const loader = async ({ request }: DataFunctionArgs) => {
  const user = await getUser(request)
  if (user) return redirect('/')

  return null
}

export default function AuthLayout() {
  return (
    <>
      <div className="flex min-h-full">
        <div className="relative hidden flex-1 lg:block">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src="/auth-image.png"
            alt=""
          />
        </div>

        <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  )
}
