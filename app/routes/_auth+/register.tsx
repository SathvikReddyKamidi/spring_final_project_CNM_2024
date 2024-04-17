import {
  Anchor,
  Button,
  PasswordInput,
  Textarea,
  TextInput,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import type { ActionFunction } from '@remix-run/node'
import { Form, Link, useActionData, useNavigation } from '@remix-run/react'
import { createUserSession } from '~/lib/session.server'
import { createUser, getUserByEmail } from '~/lib/user.server'
import { badRequest, validateEmail, validateName } from '~/utils/misc.server'
import { Role } from '~/utils/prisma-enums'

interface ActionData {
  fieldErrors?: {
    email?: string
    password?: string
    name?: string
    dateOfBirth?: string
    phoneNo?: string
  }
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()

  const email = formData.get('email')
  const password = formData.get('password')
  const confirmPassword = formData.get('confirmPassword')
  const name = formData.get('name')
  const address = formData.get('address')?.toString()
  const dateOfBirth = formData.get('dateOfBirth')?.toString()
  const phoneNo = formData.get('phoneNo')?.toString()

  if (!validateName(name)) {
    return badRequest<ActionData>({
      fieldErrors: {
        name: 'Name is required',
      },
    })
  }

  if (!validateEmail(email)) {
    return badRequest<ActionData>({
      fieldErrors: { email: 'Email is invalid' },
    })
  }

  if (typeof password !== 'string' || typeof confirmPassword !== 'string') {
    return badRequest<ActionData>({
      fieldErrors: { password: 'Password is required' },
    })
  }

  if (password.length < 8 || confirmPassword.length < 8) {
    return badRequest<ActionData>({
      fieldErrors: { password: 'Password is too short' },
    })
  }

  if (password !== confirmPassword) {
    return badRequest<ActionData>({
      fieldErrors: { password: 'Passwords do not match' },
    })
  }

  if (!dateOfBirth) {
    return badRequest<ActionData>({
      fieldErrors: { dateOfBirth: 'Date of birth is required' },
    })
  }

  if (!phoneNo) {
    return badRequest<ActionData>({
      fieldErrors: { phoneNo: 'Phone number is required' },
    })
  }

  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    return badRequest<ActionData>({
      fieldErrors: { email: 'A user already exists with this email' },
    })
  }

  const user = await createUser({
    email,
    password,
    name,
    address,
    phoneNo,
    dateOfBirth: new Date(dateOfBirth),
  })

  return createUserSession({
    request,
    userId: user.id,
    role: Role.CUSTOMER,
    redirectTo: '/',
  })
}
export default function Register() {
  const transition = useNavigation()
  const actionData = useActionData<ActionData>()
  const isSubmitting = transition.state !== 'idle'

  return (
    <>
      <div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Register</h2>
        <p className="mt-2 text-sm text-gray-600">
          Have an account already?{' '}
          <Anchor component={Link} to="/login" size="sm" prefetch="intent">
            Sign in
          </Anchor>
        </p>
      </div>

      <Form replace method="post" className="mt-8">
        <fieldset disabled={isSubmitting} className="flex flex-col gap-4">
          <TextInput
            name="name"
            autoComplete="given-name"
            label="Name"
            error={actionData?.fieldErrors?.name}
            required
          />

          <TextInput
            name="email"
            type="email"
            autoComplete="email"
            label="Email address"
            error={actionData?.fieldErrors?.email}
            required
          />

          <DatePickerInput
            name="dateOfBirth"
            label="Date of birth"
            error={actionData?.fieldErrors?.dateOfBirth}
            required
          />

          <TextInput
            name="phoneNo"
            type="tel"
            label="Phone number"
            error={actionData?.fieldErrors?.phoneNo}
            required
          />

          <PasswordInput
            name="password"
            label="Password"
            error={actionData?.fieldErrors?.password}
            autoComplete="current-password"
            required
          />

          <PasswordInput
            name="confirmPassword"
            label="Confirm password"
            error={actionData?.fieldErrors?.password}
            autoComplete="current-password"
            required
          />

          <Textarea
            name="address"
            label="Address"
            autoComplete="street-address"
          />

          <Button type="submit" loading={isSubmitting} fullWidth mt="1rem">
            Register
          </Button>
        </fieldset>
      </Form>
    </>
  )
}
