import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "../ui/button"

export function ErrorDisplay({
  message = "Something went wrong",
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="grid place-items-center size-16 rounded-full bg-red-50 mb-4">
        <AlertTriangle className="size-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Oops!</h3>
      <p className="text-muted-foreground max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCw className="size-4" /> Try Again
        </Button>
      )}
    </div>
  )
}

export function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
      <AlertTriangle className="size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
