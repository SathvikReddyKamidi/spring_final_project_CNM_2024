import { Button, Modal, MultiSelect, NumberInput, Select } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import cuid from 'cuid'
import * as React from 'react'
import { Icon } from '~/components/ui/icon'
import type { CartItem } from '~/context/CartContext'
import { useCart } from '~/context/CartContext'
import { db } from '~/lib/prisma.server'
import { formatCurrency } from '~/utils/misc'

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { slug } = params

  if (!slug) {
    throw new Response('No slug provided', { status: 404 })
  }

  const iceCreamType = await db.iceCreamType.findUnique({
    where: {
      slug,
    },
  })

  if (!iceCreamType) {
    return redirect('/')
  }

  const flavours = await db.iceCreamFlavour.findMany({})
  const mixins = await db.iceCreamMixins.findMany({})

  return json({ slug, iceCreamType, flavours, mixins })
}

export default function Item() {
  const { slug, iceCreamType, flavours, mixins } =
    useLoaderData<typeof loader>()
  const { addItemToCart } = useCart()

  const [isAddScoopModelOpen, handleScoopModal] = useDisclosure(false, {
    onClose: () => {
      setSelectedFlavourId(null)
      setScoopCount(1)
    },
  })
  const [selectedFlavourId, setSelectedFlavourId] = React.useState<
    string | null
  >(null)
  const [scoopCount, setScoopCount] = React.useState<number>(1)
  const [finalIceCream, setFinalIceCream] = React.useState<
    Omit<CartItem, 'totalPrice'>
  >({
    id: cuid(),
    type: slug,
    flavour: [],
    mixins: [],
  })

  const isAnyScoopPresent = finalIceCream.flavour.length > 0

  const totalPrice = React.useMemo(() => {
    let price = 0

    finalIceCream.flavour.forEach((f) => {
      const flavour = flavours.find((flavour) => flavour.id === f.id)

      if (flavour) {
        price += flavour.price * f.quantity
      }
    })

    finalIceCream.mixins.forEach((m) => {
      const mixin = mixins.find((mixin) => mixin.id === m)

      if (mixin) {
        price += mixin.price
      }
    })

    return price
  }, [finalIceCream, flavours, mixins])
  return (
    <>
      <div className="flex flex-col gap-4 p-4">
        <div className="bg-[rgb(129, 135, 80)]">
          <div className="mx-auto max-w-2xl pb-16 px-4 sm:pt-6 sm:pb-24 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-12 lg:px-8">
            <div className="sm:mt-10 lg:row-span-2 lg:mt-0 lg:self-center">
              <div className="mb-12">
                <Button
                  leftSection={<Icon name="arrow-left" size="md" />}
                  variant="white"
                  size="md"
                  component={Link}
                  to=".."
                  pl={0}
                >
                  Back
                </Button>
              </div>
              <div className="overflow-hidden rounded-lg shadow">
                <img
                  src={iceCreamType.image}
                  alt={iceCreamType.name}
                  className="w-full object-cover h-96"
                />
              </div>
            </div>

            <div className="lg:col-start-2 lg:max-w-lg lg:self-end">
              <div className="mt-4">
                <h1 className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                  Customize your {iceCreamType.name}
                </h1>
              </div>

              <section className="mt-8 flex flex-col gap-6">
                <div className="flex items-center gap-4 border-b py-4">
                  <Button
                    size="compact-sm"
                    variant="outline"
                    onClick={() => handleScoopModal.open()}
                  >
                    Add scoop
                  </Button>
                </div>

                <div className="flex flex-col gap-4 border-b py-4">
                  {finalIceCream?.flavour.map((f) => {
                    const flavour = flavours.find(
                      (flavour) => flavour.id === f.id
                    )

                    return (
                      <div
                        className="flex items-center justify-between gap-4"
                        key={f.id}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-gray-500">{flavour?.name}</span>
                          <span className="text-gray-500">
                            ({f.quantity} scoops)
                          </span>
                          <span className="text-gray-500">
                            {formatCurrency(flavour?.price! * f.quantity)}
                          </span>
                        </div>

                        <Button
                          variant="outline"
                          color="red"
                          size="compact-sm"
                          onClick={() => {
                            let newFlavour = finalIceCream.flavour.filter(
                              (flavour) => flavour.id !== f.id
                            )

                            setFinalIceCream({
                              ...finalIceCream,
                              flavour: newFlavour,
                              mixins:
                                newFlavour.length === 0
                                  ? []
                                  : finalIceCream.mixins,
                            })
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    )
                  })}
                </div>

                {isAnyScoopPresent ? (
                  <div className="flex flex-col gap-4 py-4">
                    <MultiSelect
                      label="Mixins"
                      placeholder="Select mixins"
                      data={mixins.map((mixin) => ({
                        label: mixin.name,
                        value: mixin.id,
                      }))}
                      onChange={(values) => {
                        if (values.length > 0) {
                          return setFinalIceCream((prev) => {
                            return {
                              ...prev,
                              mixins: values,
                            }
                          })
                        } else {
                          return setFinalIceCream((prev) => ({
                            ...prev,
                            mixins: [],
                          }))
                        }
                      }}
                    />

                    {finalIceCream.mixins.length > 0 && (
                      <div className="flex flex-col gap-4 border-b py-4">
                        {finalIceCream.mixins.map((mixin) => {
                          const _mixin = mixins.find((m) => m.id === mixin)

                          if (!_mixin) {
                            return null
                          }

                          return (
                            <div
                              className="flex items-center justify-between gap-4"
                              key={mixin}
                            >
                              <span className="text-gray-500">
                                {_mixin.name}
                              </span>

                              <span className="text-gray-500">
                                {formatCurrency(_mixin.price)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* total price for both icecream and mixins*/}
                    <div className="mt-8 flex items-center justify-between">
                      <span className="text-gray-500">Total price</span>
                      <span className="text-gray-500">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                  </div>
                ) : null}
              </section>
            </div>

            <div className="mt-6 lg:col-start-2 lg:row-start-2 lg:max-w-lg lg:self-start">
              <Button
                fullWidth
                mt="2.5rem"
                disabled={!isAnyScoopPresent}
                onClick={() => {
                  console.log('finalIceCream', { ...finalIceCream, totalPrice })

                  addItemToCart({
                    ...finalIceCream,
                    totalPrice,
                  })
                }}
              >
                Add to cart
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        opened={isAddScoopModelOpen}
        onClose={handleScoopModal.close}
        title="Scoop it up!"
        overlayProps={{
          blur: 1,
          opacity: 1,
        }}
        padding="xl"
      >
        <div className="mt-6 flex flex-col gap-4">
          {/* <input hidden name="userId" defaultValue={user.id} /> */}
          <Select
            required
            value={selectedFlavourId}
            placeholder="Choose your flavour"
            onChange={(e) => setSelectedFlavourId(e)}
            data={flavours.map((f) => ({
              value: f.id,
              label: f.name,
            }))}
          />

          <NumberInput
            required
            placeholder="How many scoops?"
            min={1}
            max={10}
            value={scoopCount}
            // @ts-expect-error - Fix it later
            onChange={setScoopCount}
            defaultValue={1}
          />

          <Button
            fullWidth
            size="compact-sm"
            disabled={selectedFlavourId === null || scoopCount === undefined}
            variant="light"
            onClick={() => {
              if (selectedFlavourId === null || scoopCount === undefined) {
                return
              }

              setFinalIceCream((prevState) => {
                if (!prevState) {
                  return {
                    id: cuid(),
                    type: iceCreamType.slug,
                    flavour: [{ id: selectedFlavourId, quantity: scoopCount }],
                    mixins: [],
                  }
                }

                const flavourIndex = prevState.flavour.findIndex(
                  (flavour) => flavour.id === selectedFlavourId
                )

                if (flavourIndex !== -1) {
                  prevState.flavour[flavourIndex].quantity += scoopCount
                } else {
                  prevState.flavour.push({
                    id: selectedFlavourId,
                    quantity: scoopCount,
                  })
                }

                let newFinalIceCream = {
                  ...prevState,
                  flavour: [...prevState.flavour],
                }

                return newFinalIceCream
              })

              handleScoopModal.close()
            }}
          >
            Add
          </Button>
        </div>
      </Modal>
    </>
  )
}
