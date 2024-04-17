import { cleanNotifications, showNotification } from '@mantine/notifications'
import * as React from 'react'
import { Icon } from '~/components/ui/icon'
import { useLocalStorageState } from '~/utils/hooks'

const LocalStorageKey = 'icsms-application'

export type CartItem = {
  id: string
  type: string
  flavour: {
    id: string
    quantity: number
  }[]
  mixins: string[]
  totalPrice: number
}

interface ICartContext {
  itemsInCart: Array<CartItem>
  addItemToCart: (item: CartItem) => void
  removeItemFromCart: (itemId: CartItem['id']) => void
  clearCart: () => void
  totalPrice: number
}

const CartContext = React.createContext<ICartContext | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useLocalStorageState<CartItem[]>({
    key: LocalStorageKey,
    defaultValue: [],
  })

  const totalPrice = items.reduce((acc, item) => acc + item.totalPrice, 0)

  const clearCart = React.useCallback(() => {
    cleanNotifications()
    setItems([])
    showNotification({
      title: 'Successfully cleared',
      message: 'All items in the cart are cleared',
      icon: <Icon name="circle-check" size="md" />,
      color: 'green',
    })
  }, [setItems])

  const addItemToCart = React.useCallback(
    (item: CartItem) => {
      cleanNotifications()

      setItems((prev) => [
        ...prev,
        {
          ...item,
        },
      ])

      return showNotification({
        title: 'Successfully added',
        message: `Added to cart`,
        color: 'green',
        icon: <Icon name="circle-check" size="md" />,
      })
    },
    [setItems]
  )

  const removeItemFromCart = (itemId: CartItem['id']) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))

    showNotification({
      title: 'Successfully removed',
      message: 'Item removed from cart',
      icon: <Icon name="circle-minus" size="md" />,
      color: 'red',
    })
  }

  return (
    <CartContext.Provider
      value={{
        itemsInCart: items,
        totalPrice,
        addItemToCart,
        removeItemFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = React.useContext(CartContext)
  if (!context) {
    throw new Error('`useCart()` must be used within a <CartProvider />')
  }

  return context
}
