import { Button, Drawer, Modal, NumberInput, TextInput } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { ActionFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { v4 as uuid } from 'uuid'
import clsx from 'clsx'

import * as React from 'react'
import { z } from 'zod'
import { EmptyState } from '~/components/EmptyState'
import { PageHeading } from '~/components/ui/PageHeading'
import { Icon } from '~/components/ui/icon'
import { db } from '~/lib/prisma.server'
import { badRequest } from '~/utils/misc.server'
import type { inferErrors } from '~/utils/validation'
import { validateAction } from '~/utils/validation'

const ManageFlavourSchema = z.object({
  productId: z.string().optional(),
  name: z.string().trim().min(1, 'Name is required'),
  price: z.preprocess(Number, z.number().min(1, 'Price is required')),
})

enum MODE {
  edit,
  add,
}

export const loader = async () => {
  const flavours = await db.iceCreamFlavour.findMany({})

  return json({
    products: flavours,
  })
}

interface ActionData {
  success: boolean
  fieldErrors?: inferErrors<typeof ManageFlavourSchema>
}

export const action: ActionFunction = async ({ request }) => {
  const { fields, fieldErrors } = await validateAction(
    request,
    ManageFlavourSchema
  )

  if (fieldErrors) {
    return badRequest<ActionData>({ success: false, fieldErrors })
  }

  const { productId, ...rest } = fields
  const id = uuid()

  if (!productId) {
    const existingProduct = await db.iceCreamFlavour.findFirst({
      where: {
        name: {
          equals: rest.name,
          mode: 'insensitive',
        },
      },
    })

    if (existingProduct) {
      return badRequest<ActionData>({
        success: false,
        fieldErrors: {
          name: 'A flavour with that name already exists',
        },
      })
    }
  }

  await db.iceCreamFlavour.upsert({
    where: {
      id: productId || id.toString(),
    },
    update: {
      ...rest,
    },
    create: {
      ...rest,
    },
  })

  return json({
    success: true,
  })
}

export default function ManageProduct() {
  const fetcher = useFetcher<ActionData>()
  const { products } = useLoaderData<typeof loader>()

  const [selectedProduct, setSelectedProduct] = React.useState<
    (typeof products)[number] | null
  >(null)
  const [mode, setMode] = React.useState<MODE>(MODE.edit)
  const [isModalOpen, { open: openModal, close: closeModal }] =
    useDisclosure(false)

  const isSubmitting = fetcher.state !== 'idle'

  React.useEffect(() => {
    if (!fetcher.data || isSubmitting) return

    if (fetcher.data.success) {
      setSelectedProduct(null)
      closeModal()
    }
  }, [fetcher.data, isSubmitting])

  React.useEffect(() => {
    if (mode === MODE.add) {
      setSelectedProduct(null)
      setSelectedProduct(null)
    }
  }, [mode])

  return (
    <>
      <div className="flex h-full max-w-screen-xl flex-col gap-8 bg-white py-2">
        <div className="mt-6 px-10">
          <PageHeading
            title="Manage Flavours"
            rightSection={
              <Button
                leftSection={<Icon name="plus" size="sm" />}
                onClick={() => {
                  setMode(MODE.add)
                  openModal()
                }}
              >
                Add flavour
              </Button>
            }
          />
        </div>

        <div className="flex flex-1 flex-col gap-8 rounded-tl-3xl bg-blue-50 px-10 py-8">
          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                {products.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="hidden py-3.5 px-3 text-left text-sm font-semibold text-gray-900 sm:table-cell"
                        >
                          Price
                        </th>
                        <th
                          scope="col"
                          className="relative py-3.5 pl-3 pr-4 sm:pr-6 md:pr-0"
                        >
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map((ic) => (
                        <tr key={ic.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
                            {ic.name}
                          </td>
                          <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                            ${ic.price.toFixed(2)}
                          </td>

                          <td className="relative space-x-4 whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6 md:pr-0">
                            <div className="flex items-center gap-6">
                              <Button
                                loading={isSubmitting}
                                variant="subtle"
                                onClick={() => {
                                  setMode(MODE.edit)

                                  const product = products.find(
                                    (product) => product.id === ic.id
                                  )
                                  if (!product) {
                                    return
                                  }

                                  setSelectedProduct(product)
                                  openModal()
                                }}
                              >
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <EmptyState message="No flavours found." />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        opened={isModalOpen}
        onClose={() => {
          setSelectedProduct(null)
          openModal()
        }}
        title={clsx({
          'Edit Flavour': mode === MODE.edit,
          'Add Flavour': mode === MODE.add,
        })}
        overlayProps={{
          blur: 3,
          opacity: 6,
        }}
        size="lg"
        padding="lg"
        closeOnClickOutside={isSubmitting ? false : true}
        closeOnEscape={isSubmitting ? false : true}
      >
        <fetcher.Form method="post">
          <fieldset disabled={isSubmitting} className="flex flex-col gap-4">
            <input type="hidden" name="productId" value={selectedProduct?.id} />

            <TextInput
              name="name"
              label="Name"
              defaultValue={selectedProduct?.name}
              error={fetcher.data?.fieldErrors?.name}
              required
            />

            <NumberInput
              mt={12}
              required
              name="price"
              leftSection={<Icon name="dollar-sign" size="sm" />}
              decimalScale={2}
              fixedDecimalScale
              label="Price per scoop"
              min={1}
              defaultValue={selectedProduct?.price || 1}
            />

            <div className="mt-1 flex items-center justify-end gap-4">
              <Button
                variant="subtle"
                type="button"
                disabled={isSubmitting}
                onClick={() => closeModal()}
                color="red"
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {mode === MODE.edit ? 'Save' : 'Create'}
              </Button>
            </div>
          </fieldset>
        </fetcher.Form>
      </Modal>
    </>
  )
}
