import type { LoaderFunctionArgs, SerializeFrom } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { Outlet } from '@remix-run/react'
import { Nav, NavMenuItems } from '~/components/Nav'
import { Icon } from '~/components/ui/icon'
import { isCustomer, requireUser } from '~/lib/session.server'

export const ROUTE = '/admin'
export type AppLoaderData = SerializeFrom<typeof loader>
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUser(request)

  if (await isCustomer(request)) {
    return redirect('/')
  }

  return json({})
}

const navMenu: NavMenuItems = [
  {
    items: [
      {
        name: 'Manage Orders',
        href: `${ROUTE}`,
        icon: <Icon name="settings" size="md" />,
      },
      {
        name: 'Flavors',
        href: `${ROUTE}/flavours`,
        icon: <Icon name="ice-cream-cone" size="md" />,
      },
      {
        name: 'Mixins',
        href: `${ROUTE}/mixins`,
        icon: <Icon name="dessert" size="md" />,
      },
    ],
  },
]

export default function AppLayout() {
  return (
    <>
      <Nav menuItems={navMenu} />

      <div className="h-full sm:pl-56">
        <Outlet />
      </div>
    </>
  )
}
