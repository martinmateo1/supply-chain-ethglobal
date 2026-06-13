"use client"

import { useCallback, useRef, useState } from "react"
import { FileText, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { formatBytes, hashFile } from "@/lib/file-hash"
import type { TransferAttachment } from "@/lib/types"
import { cn } from "@/lib/utils"

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

type CertificateDropzoneProps = {
  attachments: TransferAttachment[]
  onChange: (attachments: TransferAttachment[]) => void
  disabled?: boolean
  label?: string
  description?: string
}

export function CertificateDropzone({
  attachments,
  onChange,
  disabled = false,
  label = "Supporting documentation",
  description = "Attach one or more documents that support this transfer, such as transport sheets or receipts.",
}: CertificateDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      if (fileArray.length === 0) return

      setError(null)
      setIsProcessing(true)

      try {
        const next: TransferAttachment[] = [...attachments]

        for (const file of fileArray) {
          if (
            file.type &&
            !ACCEPTED_TYPES.includes(file.type) &&
            !file.name.match(/\.(pdf|png|jpe?g|webp|docx?)$/i)
          ) {
            setError("Only PDF, image, or Word document files are supported.")
            continue
          }

          const duplicate = next.some(
            (item) => item.name === file.name && item.size === file.size
          )
          if (duplicate) continue

          const hash = await hashFile(file)
          next.push({
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            hash,
          })
        }

        onChange(next)
      } finally {
        setIsProcessing(false)
      }
    },
    [attachments, onChange]
  )

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (disabled || isProcessing) return
    void addFiles(event.dataTransfer.files)
  }

  function removeAttachment(id: string) {
    onChange(attachments.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(event) => {
          if (disabled || isProcessing) return
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          if (event.currentTarget.contains(event.relatedTarget as Node)) return
          setIsDragging(false)
        }}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && !isProcessing) inputRef.current?.click()
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-input bg-muted/20 hover:bg-muted/40",
          (disabled || isProcessing) && "cursor-not-allowed opacity-50"
        )}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-background shadow-xs">
          <Upload className="size-4 text-muted-foreground" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">
            {isProcessing ? "Hashing files…" : "Drag and drop supporting documentation"}
          </p>
          <p className="text-xs text-muted-foreground">
            or click to browse · PDF, images, Word
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,application/pdf,image/*"
          className="hidden"
          disabled={disabled || isProcessing}
          onChange={(event) => {
            if (event.target.files) void addFiles(event.target.files)
            event.target.value = ""
          }}
        />
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {attachments.length > 0 ? (
        <ul className="space-y-2">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
            >
              <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{attachment.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(attachment.size)} ·{" "}
                  <span className="font-mono">{attachment.hash.slice(0, 14)}…</span>
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="size-7 shrink-0 p-0"
                disabled={disabled}
                onClick={(event) => {
                  event.stopPropagation()
                  removeAttachment(attachment.id)
                }}
                aria-label={`Remove ${attachment.name}`}
              >
                <X className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
