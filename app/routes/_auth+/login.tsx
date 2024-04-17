import {
  Anchor,
  Button,
  PasswordInput,
  SegmentedControl,
  Switch,
  TextInput,
} from '@mantine/core'

import type { ActionFunction } from '@remix-run/node'
import { Link, useFetcher, useSearchParams } from '@remix-run/react'
import { createUserSession } from '~/lib/session.server'
import { verifyLogin } from '~/lib/user.server'
import { LoginSchema } from '~/lib/zod.schema'
import { badRequest, safeRedirect } from '~/utils/misc.server'
import { Role } from '~/utils/prisma-enums'
import type { inferErrors } from '~/utils/validation'
import { validateAction } from '~/utils/validation'

interface ActionData {
  fieldErrors?: inferErrors<typeof LoginSchema>
}

export const action: ActionFunction = async ({ request }) => {
  const { fieldErrors, fields } = await validateAction(request, LoginSchema)

  if (fieldErrors) {
    return badRequest<ActionData>({ fieldErrors })
  }

  const { email, password, redirectTo, remember } = fields

  const user = await verifyLogin(email, password)
  if (!user) {
    return badRequest<ActionData>({
      fieldErrors: {
        password: 'Invalid username or password',
      },
    })
  }

  return createUserSession({
    request,
    userId: user.id,
    role: user.role,
    remember: remember === 'on' ? true : false,
    redirectTo: safeRedirect(redirectTo),
  })
}

export default function Login() {
  const [searchParams] = useSearchParams()

  const fetcher = useFetcher<ActionData>()
  const actionData = fetcher.data

  const redirectTo = searchParams.get('redirectTo') || '/'
  const isSubmitting = fetcher.state !== 'idle'

  return (
    <>
      <div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in</h2>
        <p className="mt-2 text-sm text-gray-600">
          Do not have an account yet?{' '}
          <Anchor component={Link} to="/register" size="sm" prefetch="intent">
            Create account
          </Anchor>
        </p>
      </div>

      <fetcher.Form method="post" className="mt-8">
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <fieldset disabled={isSubmitting} className="flex flex-col gap-4">
          <SegmentedControl
            name="role"
            title="Role"
            data={Object.values(Role).map((role) => ({
              label: role,
              value: role,
            }))}
          />

          <TextInput
            name="email"
            type="email"
            autoComplete="email"
            label="Email address"
            error={actionData?.fieldErrors?.email}
            required
          />

          <PasswordInput
            name="password"
            label="Password"
            error={actionData?.fieldErrors?.password}
            autoComplete="current-password"
            required
          />

          <Switch id="remember-me" name="rememberMe" label="Remember me" />

          <Button type="submit" loading={isSubmitting} fullWidth mt="1rem">
            Sign in
          </Button>
        </fieldset>
      </fetcher.Form>
    </>
  )
}
