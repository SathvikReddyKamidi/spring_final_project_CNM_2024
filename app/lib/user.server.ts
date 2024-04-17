import type { User } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { db } from '~/lib/prisma.server'
import { createPasswordHash } from '~/utils/misc.server'
import { Role } from '~/utils/prisma-enums'

export async function getUserById(id: User['id']) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      address: true,
    },
  })
}

export async function getUserByEmail(email: User['email']) {
  return db.user.findUnique({
    where: { email },
    select: {
      name: true,
      email: true,
    },
  })
}

export async function createUser({
  email,
  password,
  name,
  role = Role.CUSTOMER,
  address,
  dateOfBirth,
  phoneNo,
}: {
  email: User['email']
  password: string
  name: User['name']
  role?: User['role']
  address?: User['address']
  dateOfBirth?: User['dateOfBirth']
  phoneNo?: User['phoneNo']
}) {
  return db.user.create({
    data: {
      name,
      email,
      password: await createPasswordHash(password),
      role,
      address,
      dateOfBirth,
      phoneNo,
    },
  })
}

export async function verifyLogin(email: User['email'], password: string) {
  const userWithPassword = await db.user.findUnique({
    where: { email },
  })

  if (!userWithPassword || !userWithPassword.password) {
    return null
  }

  const isValid = bcrypt.compareSync(password, userWithPassword.password)

  if (!isValid) {
    return null
  }

  const { password: _password, ...userWithoutPassword } = userWithPassword

  return userWithoutPassword
}
