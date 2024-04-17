import { PrismaClient } from '@prisma/client'
import { createPasswordHash } from '~/utils/misc.server'
import { Role } from '~/utils/prisma-enums'

const db = new PrismaClient()

async function seed() {
  await db.user.deleteMany()
  await db.order.deleteMany()
  await db.admin.deleteMany()
  await db.iceCreamType.deleteMany()
  await db.iceCreamOrder.deleteMany()
  await db.iceCreamMixins.deleteMany()
  await db.iceCreamFlavour.deleteMany()

  await db.user.create({
    data: {
      name: 'John Doe',
      email: 'user@app.com',
      password: await createPasswordHash('password'),
      role: Role.CUSTOMER,
      address: '123 Main St',
    },
  })

  await db.user.create({
    data: {
      name: 'Roxanna',
      email: 'admin@app.com',
      password: await createPasswordHash('password'),
      role: Role.ADMIN,
    },
  })

  await db.admin.create({
    data: {
      name: 'Roxanna',
      email: 'admin@app.com',
      password: await createPasswordHash('password'),
    },
  })

  await db.iceCreamType.createMany({
    data: [
      {
        name: 'Cup',
        slug: 'cup',
        image:
          'https://images.unsplash.com/photo-1534706936160-d5ee67737249?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
        maxScoops: 7,
      },
      {
        name: 'Cone',
        slug: 'cone',
        image:
          'https://images.unsplash.com/photo-1559703248-dcaaec9fab78?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=764&q=80',
        maxScoops: 3,
      },
    ],
  })

  await db.iceCreamFlavour.createMany({
    data: [
      {
        name: 'Vanilla',
        price: 1.5,
      },
      {
        name: 'Chocolate',
        price: 1.5,
      },
      {
        name: 'Strawberry',
        price: 1.5,
      },
      {
        name: 'Mint',
        price: 1.5,
      },
      {
        name: 'Pistachio',
        price: 1.5,
      },
    ],
  })

  await db.iceCreamMixins.createMany({
    data: [
      {
        name: 'Sprinkles',
        price: 0.5,
      },
      {
        name: 'Chocolate Chips',
        price: 0.5,
      },
      {
        name: 'Oreos',
        price: 0.5,
      },
      {
        name: 'Gummy Bears',

        price: 0.5,
      },
      {
        name: 'Peanuts',
        price: 0.5,
      },
    ],
  })

  console.log(`Database has been seeded. 🌱`)
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
