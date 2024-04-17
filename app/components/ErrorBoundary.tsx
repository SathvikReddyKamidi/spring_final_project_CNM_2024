import { Icon } from '~/components/ui/icon'

export default function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md p-8 bg-white shadow-lg rounded-md">
        <div className="text-center space-y-4">
          <Icon name="info" size="xl" className="mx-auto text-red-500" />
          <h2 className="text-2xl font-bold text-gray-700">
            Oops! Something went wrong.
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    </div>
  )
}
