import type { Order, Payment, User } from '@prisma/client'

import type { CartItem } from '~/context/CartContext'
import { db } from './prisma.server'
import { OrderStatus, OrderType, PaymentMethod } from '~/utils/prisma-enums'

export function getAllOrders() {
  return db.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      payment: true,
      icecreams: true,
    },
  })
}

export function getOrders(userId: User['id']) {
  return db.order.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      payment: true,
      icecreams: true,
    },
  })
}

export function createOrder({
  userId,
  products,
  amount,
  orderType,
  paymentMethod,
  address,
  pickupTime,
}: {
  userId: User['id']
  products: Array<CartItem>
  amount: Payment['amount']
  paymentMethod: PaymentMethod
  orderType: OrderType
  address: Required<Payment['address']>
  pickupTime: Order['pickupTime']
}) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        type: orderType,
        status: OrderStatus.ORDER_PLACED,
        pickupTime,
        payment: {
          create: {
            paymentMethod,
            address,
            amount,
            user: {
              connect: {
                id: userId,
              },
            },
          },
        },
      },
    })

    await tx.iceCreamOrder.createMany({
      data: products.map((p) => ({
        amount: p.totalPrice,
        type: p.type,
        orderId: order.id,
        flavourIds: p.flavour.map((f) => f.id),
        mixinIds: p.mixins.map((m) => m),
      })),
    })

    return order
  })
}

export async function cancelOrder(orderId: Order['id']) {
  await db.order.update({
    where: {
      id: orderId,
    },
    data: {
      status: OrderStatus.CANCELLED,
    },
  })
}
