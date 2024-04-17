import { Anchor, Button } from '@mantine/core'
import { Link } from '@remix-run/react'
import { TailwindContainer } from '~/components/TailwindContainer'
import { useCart } from '~/context/CartContext'
import { useAppData } from '~/utils/hooks'

export default function Dashboard() {
  const { iceCreamTypes } = useAppData()

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="bg-[rgb(129, 135, 80)]">
        <TailwindContainer>
          <div className="py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
                Choose your ice cream type
              </h2>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
              {iceCreamTypes.map((icType) => {
                return (
                  <div key={icType.id} className="mx-auto sm:mx-[unset]">
                    <div className="h-48 overflow-hidden rounded-md bg-gray-200 shadow lg:h-64">
                      <img
                        src={icType.image}
                        alt={icType.name}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>

                    <h3 className="mt-4 text-sm text-gray-700">
                      <Anchor
                        to={`/type/${icType.slug}`}
                        prefetch="intent"
                        component={Link}
                      >
                        {icType.name}
                      </Anchor>
                    </h3>

                    <Button
                      to={`/type/${icType.slug}`}
                      component={Link}
                      fullWidth
                      mt="md"
                    >
                      View
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </TailwindContainer>
      </div>
    </div>
  )
}
