import {
  Anchor,
  Avatar,
  Button,
  Divider,
  Indicator,
  Menu,
  ScrollArea,
} from '@mantine/core'
import type { LoaderFunctionArgs, SerializeFrom } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import {
  Form,
  Link,
  Outlet,
  useLoaderData,
  useLocation,
} from '@remix-run/react'
import { Footer } from '~/components/Footer'
import { TailwindContainer } from '~/components/TailwindContainer'
import { Icon } from '~/components/ui/icon'
import { useCart } from '~/context/CartContext'
import { db } from '~/lib/prisma.server'
import { isAdmin, isCustomer, requireUserId } from '~/lib/session.server'
import { useOptionalUser } from '~/utils/hooks'

export type AppLoaderData = SerializeFrom<typeof loader>
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request)

  if (await isAdmin(request)) {
    return redirect('/admin')
  }

  const iceCreamTypes = await db.iceCreamType.findMany({})

  return json({
    iceCreamTypes,
    isCustomer: await isCustomer(request),
  })
}

export default function AppLayout() {
  return (
    <>
      <div className="flex h-full flex-col">
        <HeaderComponent />
        <ScrollArea classNames={{ root: 'flex-1' }}>
          <main>
            <Outlet />
          </main>
        </ScrollArea>
        <Footer />
      </div>
    </>
  )
}

function HeaderComponent() {
  const location = useLocation()
  const { user } = useOptionalUser()
  const { itemsInCart } = useCart()
  const { isCustomer } = useLoaderData<typeof loader>()

  return (
    <>
      <Form replace action="/api/auth/logout" method="post" id="logout-form" />
      <header className="h-32 p-4 border-b bg-blue-100">
        <TailwindContainer>
          <div className="flex h-full w-full items-center justify-between">
            <div></div>
            <div className="flex flex-shrink-0 items-center gap-4">
              <Anchor component={Link} to="/">
                <img src="/logo.png" alt="Logo" className="h-20 w-auto" />
              </Anchor>
            </div>

            <div className="flex items-center gap-4">
              <Indicator
                label={itemsInCart.length}
                inline
                size={16}
                disabled={itemsInCart.length <= 0}
                color="red"
                offset={7}
              >
                <Button
                  px={8}
                  component={Link}
                  variant="subtle"
                  to="/cart"
                  title="Cart"
                  color="gray"
                >
                  <Icon
                    name="shopping-cart"
                    size="md"
                    className="text-gray-500"
                  />
                </Button>
              </Indicator>

              <Menu
                position="bottom-start"
                withArrow
                transitionProps={{
                  transition: 'pop-top-right',
                }}
              >
                <Menu.Target>
                  <button>
                    {user ? (
                      <Avatar color="blue" size="md">
                        {user.name.charAt(0)}
                      </Avatar>
                    ) : (
                      <Avatar />
                    )}
                  </button>
                </Menu.Target>

                <Menu.Dropdown>
                  {user ? (
                    <>
                      <Menu.Item disabled>
                        <div className="flex flex-col">
                          <p>{user.name}</p>
                          <p className="mt-0.5 text-sm">{user.email}</p>
                        </div>
                      </Menu.Item>
                      <Divider />

                      {isCustomer ? (
                        <Menu.Item
                          leftSection={<Icon name="shopping-bag" size="sm" />}
                          component={Link}
                          to="/order-history"
                        >
                          Your orders
                        </Menu.Item>
                      ) : null}
                      <Menu.Item
                        leftSection={
                          <Icon name="arrow-left-from-line" size="sm" />
                        }
                        type="submit"
                        form="logout-form"
                      >
                        Logout
                      </Menu.Item>
                    </>
                  ) : (
                    <>
                      <Menu.Item
                        leftSection={
                          <Icon name="arrow-right-from-line" size="sm" />
                        }
                        component={Link}
                        to={`/login?redirectTo=${encodeURIComponent(
                          location.pathname
                        )}`}
                      >
                        Login
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<Icon name="user-plus" size="sm" />}
                        component={Link}
                        to={`/register?redirectTo=${encodeURIComponent(
                          location.pathname
                        )}`}
                      >
                        Create account
                      </Menu.Item>
                    </>
                  )}
                </Menu.Dropdown>
              </Menu>
            </div>
          </div>
        </TailwindContainer>
      </header>
    </>
  )
}
