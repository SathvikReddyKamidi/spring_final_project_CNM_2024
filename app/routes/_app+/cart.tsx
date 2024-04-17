import {
  ActionIcon,
  Button,
  Drawer,
  Input,
  Select,
  TextInput,
  Textarea,
} from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import type { ActionFunctionArgs } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { Link, useFetcher, useLoaderData, useLocation } from '@remix-run/react'
import * as React from 'react'
import ReactInputMask from 'react-input-mask'
import { TailwindContainer } from '~/components/TailwindContainer'
import { Icon } from '~/components/ui/icon'
import type { CartItem } from '~/context/CartContext'
import { useCart } from '~/context/CartContext'
import { createOrder } from '~/lib/order.server'
import { db } from '~/lib/prisma.server'
import { getUserId } from '~/lib/session.server'
import { useOptionalUser } from '~/utils/hooks'
import { titleCase } from '~/utils/misc'
import { badRequest } from '~/utils/misc.server'
import { OrderType, PaymentMethod } from '~/utils/prisma-enums'

type ActionData = Partial<{
  success: boolean
  message: string
}>

export const loader = async () => {
  const flavours = await db.iceCreamFlavour.findMany({})
  const mixins = await db.iceCreamMixins.findMany({})

  return json({ flavours, mixins })
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  const userId = await getUserId(request)
  const intent = formData.get('intent')?.toString()

  if (!userId || !intent) {
    return json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  switch (intent) {
    case 'place-order': {
      const stringifiedProducts = formData.get('products[]')?.toString()
      const amount = formData.get('amount')?.toString()
      const orderType = formData.get('orderType')?.toString()
      const paymentMethod = formData.get('paymentMethod')?.toString()
      const address = formData.get('address')?.toString()
      const pickupTime = formData.get('pickupTime')?.toString()

      if (!stringifiedProducts || !amount || !paymentMethod || !orderType) {
        return badRequest<ActionData>({
          success: false,
          message: 'Invalid request body',
        })
      }

      if (orderType === OrderType.DELIVERY && !address) {
        return badRequest<ActionData>({
          success: false,
          message: 'Address is required for delivery',
        })
      }

      if (orderType === OrderType.PICKUP && !pickupTime) {
        return badRequest<ActionData>({
          success: false,
          message: 'Pickup time is required for pickup',
        })
      }

      const products = JSON.parse(stringifiedProducts) as Array<CartItem>

      await createOrder({
        userId,
        products,
        amount: Number(amount),
        paymentMethod: paymentMethod as PaymentMethod,
        orderType: orderType as OrderType,
        address: address || '',
        pickupTime: pickupTime ? new Date(pickupTime) : null,
      })

      return redirect('/order-history/?success=true')
    }
  }
}

export default function Cart() {
  const id = React.useId()
  const location = useLocation()
  const fetcher = useFetcher<ActionData>()

  const { clearCart, itemsInCart, totalPrice } = useCart()
  const { user } = useOptionalUser()

  const [orderType, setOrderType] = React.useState<OrderType>(OrderType.PICKUP)
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(
    PaymentMethod.CREDIT_CARD
  )
  const [address, setAddress] = React.useState(user?.address ?? '')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false)
  const [cardNumber, setCardNumber] = React.useState<string>('1234567891234567')
  const [pickUpTime, setPickUpTime] = React.useState<Date | null>(
    new Date(new Date().getTime() + 2 * 60 * 60 * 1000)
  )
  const [cardExpiry, setCardExpiry] = React.useState<Date | null>(
    new Date('2026-12-31')
  )
  const [cardCvv, setCardCvv] = React.useState<string>('123')
  const [errors, setErrors] = React.useState<{
    cardNumber?: string
    cardExpiry?: string
    cardCvv?: string
  }>({
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
  })

  const closePaymentModal = () => setIsPaymentModalOpen(false)
  const showPaymentModal = () => setIsPaymentModalOpen(true)

  const placeOrder = () => {
    const formData = new FormData()

    setErrors({
      cardNumber: '',
      cardExpiry: '',
      cardCvv: '',
    })

    if (cardNumber.replace(/[_ ]/g, '').length !== 16) {
      setErrors((prevError) => ({
        ...prevError,
        cardNumber: 'Card number must be 16 digits',
      }))
    }

    if (!cardExpiry) {
      setErrors((prevError) => ({
        ...prevError,
        cardExpiry: 'Card expiry is required',
      }))
    }

    if (!cardCvv || cardCvv.length !== 3) {
      setErrors((prevError) => ({
        ...prevError,
        cardCvv: 'Card CVV must be 3 digits',
      }))
    }

    if (Object.values(errors).some((error) => error !== '')) {
      return
    }

    formData.append('products[]', JSON.stringify(itemsInCart))
    formData.append('amount', totalPrice.toString())
    formData.append('intent', 'place-order')
    formData.append('orderType', orderType)
    formData.append('paymentMethod', paymentMethod)
    formData.append('address', address)
    formData.append('pickupTime', pickUpTime ? pickUpTime.toISOString() : '')

    fetcher.submit(formData, {
      method: 'post',
    })
  }

  const isSubmitting = fetcher.state !== 'idle'
  const isDelivery = orderType === OrderType.DELIVERY

  React.useEffect(() => {
    if (isSubmitting) {
      return
    }

    if (!fetcher.data) return

    if (!fetcher.data.success) {
      showNotification({
        title: 'Error',
        message: fetcher.data.message,
        icon: <Icon name="circle-minus" size="xl" />,
        color: 'red',
      })
      return
    }
  }, [fetcher.data, isSubmitting])

  return (
    <>
      <div className="flex flex-col gap-4 p-4">
        <div className="bg-[rgb(129, 135, 80)]">
          <TailwindContainer>
            <div className="sm:px-4py-16 py-16 px-4 sm:py-20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-12">
                    <Button
                      leftSection={<Icon name="arrow-left" size="xl" />}
                      variant="transparent"
                      size="md"
                      component={Link}
                      to=".."
                      pl={0}
                    >
                      Back
                    </Button>
                  </div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                    Your cart
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Products in your cart
                  </p>
                </div>

                {itemsInCart.length > 0 ? (
                  <div className="space-x-2">
                    <Button
                      variant="subtle"
                      color="red"
                      onClick={() => clearCart()}
                      disabled={isSubmitting}
                    >
                      Clear cart
                    </Button>

                    {user ? (
                      <Button
                        variant="light"
                        loading={isSubmitting}
                        onClick={() => showPaymentModal()}
                      >
                        Make payment
                      </Button>
                    ) : (
                      <Button
                        variant="light"
                        component={Link}
                        to={`/login?redirectTo=${encodeURIComponent(
                          location.pathname
                        )}`}
                      >
                        Sign in to order
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="mt-16">
                <h2 className="sr-only">Current ice-creams in cart</h2>

                <div className="flex flex-col gap-12">
                  {itemsInCart.length > 0 ? <CartItems /> : <EmptyState />}
                </div>
              </div>
            </div>
          </TailwindContainer>
        </div>
      </div>

      <Drawer
        opened={!!user && isPaymentModalOpen}
        onClose={closePaymentModal}
        title="Payment"
        size="lg"
        padding="md"
        overlayProps={{
          blur: 1,
          opacity: 0.7,
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm text-gray-600">
              <span className="font-semibold">Amount: </span>
              <span>${totalPrice}</span>
            </h2>
          </div>

          <Select
            label="Order type"
            value={orderType}
            clearable={false}
            onChange={(e) => setOrderType(e as OrderType)}
            data={Object.values(OrderType).map((type) => ({
              label: titleCase(type.replace(/_/g, ' ')),
              value: type,
            }))}
          />

          <Select
            label="Payment method"
            value={paymentMethod}
            clearable={false}
            onChange={(e) => setPaymentMethod(e as PaymentMethod)}
            data={Object.values(PaymentMethod).map((method) => ({
              label: titleCase(method.replace(/_/g, ' ')),
              value: method,
            }))}
          />

          <TextInput
            label="Card holder name"
            // value={address}
            // onChange={(e) => setAddress(e.target.value)}
            defaultValue={user?.name ?? ''}
            required
          />

          <Input.Wrapper
            id={id}
            label="Credit card number"
            required
            error={errors.cardNumber}
          >
            <Input
              id={id}
              component={ReactInputMask}
              mask="9999 9999 9999 9999"
              placeholder="XXXX XXXX XXXX XXXX"
              alwaysShowMask={false}
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
          </Input.Wrapper>

          <div className="flex items-center gap-4">
            <Input.Wrapper
              id={id + 'cvv'}
              label="CVV"
              labelProps={{ className: '!text-[13px] !font-semibold' }}
              required
              className="w-full"
            >
              <Input
                name="cvv"
                id={id + 'cvv'}
                component={ReactInputMask}
                mask="999"
                placeholder="XXX"
                alwaysShowMask={false}
                defaultValue="123"
              />
            </Input.Wrapper>

            <Input.Wrapper
              id={id + 'expiry'}
              label="Expiry"
              labelProps={{ className: '!text-[13px] !font-semibold' }}
              required
              className="w-full"
            >
              <Input
                name="Expiry"
                id={id + 'expiry'}
                component={ReactInputMask}
                mask="99/9999"
                placeholder="XX/XXXX"
                alwaysShowMask={false}
                defaultValue="122026"
                pattern="(0[1-9]|1[0-2])([2-9][0-9]{3}|20[2-4][0-9]|202[4-9])"
                title="Date must be 01/2024 or later"
              />
            </Input.Wrapper>
          </div>

          {isDelivery ? (
            <Textarea
              label="Delivery address"
              name="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          ) : (
            <div>
              {/* <TimeInput
                label="Pickup time"
                clearable={false}
                format="12"
                value={pickUpTime}
                onChange={setPickUpTime}
                requiredp
              /> */}
            </div>
          )}

          <div className="mt-6 flex items-center gap-4 sm:justify-end">
            <Button
              variant="subtle"
              color="red"
              onClick={() => closePaymentModal()}
            >
              Cancel
            </Button>

            <Button
              variant="filled"
              onClick={() => placeOrder()}
              loading={isSubmitting}
            >
              Place order
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  )
}

function CartItems() {
  const { flavours, mixins } = useLoaderData<typeof loader>()
  const { itemsInCart, removeItemFromCart, totalPrice } = useCart()

  return (
    <>
      <table className="mt-4 w-full text-gray-500 sm:mt-6">
        <thead className="sr-only text-left text-sm text-gray-500 sm:not-sr-only">
          <tr>
            <th scope="col" className="py-3 pr-8 font-normal sm:w-2/5 lg:w-1/3">
              Products
            </th>
            <th
              scope="col"
              className="hidden py-3 pr-8 font-normal sm:table-cell"
            >
              Price
            </th>

            <th scope="col" className="w-0 py-3 text-right font-normal" />
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 border-b border-gray-200 text-sm sm:border-t">
          {itemsInCart.map((ic) => {
            const flavourNameAndCount = ic.flavour.map((f) => {
              const flavour = flavours.find((fl) => fl.id === f.id)
              return `${flavour?.name} (x${f.quantity})`
            })

            const mixinsName = ic.mixins.map((m) => {
              const mixin = mixins.find((mix) => mix.id === m)
              return mixin?.name
            })

            return (
              <tr key={ic.id}>
                <td className="py-6 pr-8">
                  <div className="flex items-center">
                    <div>
                      <div className="flex flex-col font-medium text-gray-900">
                        <span>{titleCase(ic.type)}</span>

                        <p className="mt-2 text-xs text-gray-500">
                          Flavours : {flavourNameAndCount.join(', ')}
                        </p>

                        {ic.mixins.length > 0 && (
                          <p className="text-xs text-gray-500">
                            Mixins: {mixinsName.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="hidden py-6 pr-8 font-semibold sm:table-cell">
                  ${ic.totalPrice.toFixed(2)}
                </td>
                <td className="whitespace-nowrap py-6 text-right font-medium">
                  <ActionIcon onClick={() => removeItemFromCart(ic.id)}>
                    <Icon name="trash" size="sm" className="text-red-500" />
                  </ActionIcon>
                </td>
              </tr>
            )
          })}

          <tr>
            <td className="py-6 pr-8">
              <div className="flex items-center">
                <div>
                  <div className="font-medium text-gray-900" />
                  <div className="mt-1 sm:hidden" />
                </div>
              </div>
            </td>

            <td className="hidden py-6 pr-8 font-semibold sm:table-cell">
              <span>${totalPrice.toFixed(2)}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  )
}

function EmptyState() {
  return (
    <div className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
      <Icon name="shopping-cart" size="xl" className="mx-auto text-gray-500" />
      <span className="mt-4 block text-sm font-medium text-gray-500">
        Your cart is empty
      </span>
    </div>
  )
}
