import { Icon } from '~/components/ui/icon'

type EmptyStateProps = {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
      <Icon name="x" className="mx-auto text-gray-500" size="xl" />
      <span className="mt-4 block text-sm font-medium text-gray-500">
        {message}
      </span>
    </div>
  )
}
