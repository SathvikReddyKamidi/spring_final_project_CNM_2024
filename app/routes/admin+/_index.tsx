import { Badge, NativeSelect } from '@mantine/core'

import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData, useNavigation, useSubmit } from '@remix-run/react'
import invariant from 'tiny-invariant'
import { EmptyState } from '~/components/EmptyState'
import { PageHeading } from '~/components/ui/PageHeading'
import { getAllOrders } from '~/lib/order.server'
import { db } from '~/lib/prisma.server'
import { requireUser } from '~/lib/session.server'
import { orderStatusLabelLookup, titleCase } from '~/utils/misc'
import { OrderStatus, OrderType } from '~/utils/prisma-enums'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUser(request)

  const orders = await getAllOrders()
  return json({ orders })
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()

  const intent = formData.get('intent')?.toString()
  invariant(intent, 'Invalid intent')

  const orderId = formData.get('orderId')?.toString()
  invariant(orderId, 'Invalid order id')

  switch (intent) {
    case 'update-order-status': {
      const status = formData.get('status')?.toString()
      invariant(status, 'Invalid status')

      await db.order.update({
        where: { id: orderId },
        data: { status: status as OrderStatus },
      })

      return json({ success: true })
    }

    default:
      return json(
        { success: false, message: 'Invalid intent' },
        { status: 400 }
      )
  }
}

export default function Orders() {
  const { orders } = useLoaderData<typeof loader>()
  const transition = useNavigation()
  const submit = useSubmit()

  const isSubmitting = transition.state !== 'idle'

  return (
    <>
      <div className="flex h-full max-w-screen-xl flex-col gap-8 bg-white py-2">
        <div className="mt-6 px-10">
          <PageHeading title="Orders" />
        </div>

        <div className="flex flex-1 flex-col gap-8 rounded-tl-3xl bg-blue-50 px-10 py-8">
          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  {orders.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                          >
                            Name
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Type
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                          >
                            Update status
                            <span className="sr-only">Edit</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-[rgb(129, 135, 80)] divide-y divide-gray-200">
                        {orders.map((order) => {
                          const statusOptions =
                            order.type === OrderType.PICKUP
                              ? ['ORDER_PLACED', 'READY', 'COMPLETED']
                              : ['ORDER_PLACED', 'DELIVERED']

                          return (
                            <tr key={order.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                <div className="flex items-center">
                                  <div className="ml-4">
                                    <div className="font-medium text-gray-900">
                                      {order.user.name}
                                    </div>
                                    <div className="text-gray-500">
                                      {order.user.email}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <div className="text-gray-900">
                                  {titleCase(order.type)}
                                </div>
                                <div className="text-gray-500">
                                  (
                                  {titleCase(
                                    order.payment?.paymentMethod ?? ''
                                  )}
                                  )
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <Badge
                                  color={
                                    order.status === OrderStatus.PENDING
                                      ? 'gray'
                                      : order.status === OrderStatus.CANCELLED
                                        ? 'red'
                                        : 'green'
                                  }
                                >
                                  {orderStatusLabelLookup[order.status]}
                                </Badge>
                              </td>
                              <td className="relative flex items-center justify-center whitespace-nowrap py-4 pl-3 pr-4 text-sm font-medium sm:pr-6">
                                <div className="flex items-center gap-2">
                                  <NativeSelect
                                    className="w-48"
                                    defaultValue={order.status}
                                    data={statusOptions}
                                    disabled={
                                      isSubmitting ||
                                      order.status === OrderStatus.DELIVERED ||
                                      order.status === OrderStatus.CANCELLED ||
                                      order.status === OrderStatus.COMPLETED
                                    }
                                    onChange={(e) => {
                                      submit(
                                        {
                                          intent: 'update-order-status',
                                          orderId: order.id,
                                          status: e.target.value,
                                        },
                                        {
                                          method: 'post',
                                          replace: true,
                                        }
                                      )
                                    }}
                                  />
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <EmptyState message="No orders found" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
