import { FileText } from "lucide-react"

import { formatBytes } from "@/lib/file-hash"
import type { TransferAttachment } from "@/lib/types"
import { cn } from "@/lib/utils"

type EvidenceReferenceListProps = {
  attachments: TransferAttachment[]
  className?: string
  compact?: boolean
}

function documentTypeLabel(documentType?: string): string {
  if (!documentType) return "Supporting document"
  return documentType
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function EvidenceReferenceList({
  attachments,
  className,
  compact = false,
}: EvidenceReferenceListProps) {
  if (attachments.length === 0) return null

  return (
    <ul className={cn("space-y-2", className)}>
      {attachments.map((attachment) => (
        <li
          key={attachment.id}
          className={cn(
            "rounded-lg border border-border bg-muted/30",
            compact ? "px-3 py-2" : "px-4 py-3"
          )}
        >
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium">{attachment.name}</p>
              <p className="text-xs text-muted-foreground">
                {documentTypeLabel(attachment.documentType)}
                {attachment.issuer ? ` · ${attachment.issuer}` : ""}
                {!compact ? ` · ${formatBytes(attachment.size)}` : null}
              </p>
              <p className="text-xs text-muted-foreground">
                Content ID{" "}
                <code className="select-all rounded bg-background px-1 py-0.5 font-mono text-[11px] text-foreground">
                  {attachment.hash}
                </code>
              </p>
              {attachment.timestamp ? (
                <p className="text-xs text-muted-foreground">
                  Referenced {new Date(attachment.timestamp).toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
