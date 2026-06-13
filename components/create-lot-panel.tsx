"use client"

import { useMemo, useState } from "react"
import { PackagePlus, X } from "lucide-react"

import { CertificateDropzone } from "@/components/certificate-dropzone"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useTraceabilityStore } from "@/lib/store"
import {
  CERTIFICATION_META,
  COMMODITY_META,
  RATING_META,
  STAGE_META,
  type Certification,
  type CommodityType,
  type OriginEvidenceReference,
  type Rating,
  type TransferAttachment,
} from "@/lib/types"
import { formatTons } from "@/lib/utils"
import { originFingerprint } from "@/lib/provenance"

type CreateLotPanelProps = {
  onClose: () => void
  operationalNodeId: string
}

const COMMODITY_OPTIONS: CommodityType[] = ["coffee", "cacao"]
const RATING_OPTIONS: Rating[] = ["A", "B", "C"]
const CERTIFICATION_OPTIONS: Certification[] = ["non-gmo", "deforestation-free"]

function toOriginEvidence(
  attachments: TransferAttachment[]
): OriginEvidenceReference[] {
  const now = new Date().toISOString()
  return attachments.map((attachment) => ({
    id: attachment.id,
    name: attachment.name,
    mimeType: attachment.mimeType,
    size: attachment.size,
    hash: attachment.hash,
    documentType: attachment.mimeType.split("/")[1] ?? "document",
    timestamp: now,
  }))
}

export function CreateLotPanel({
  onClose,
  operationalNodeId,
}: CreateLotPanelProps) {
  const accounts = useTraceabilityStore((state) => state.accounts)
  const addLot = useTraceabilityStore((state) => state.addLot)

  const nodeAccount = accounts.find((account) => account.id === operationalNodeId)
  const [commodity, setCommodity] = useState<CommodityType | "">("")
  const [quantityStr, setQuantityStr] = useState("")
  const [originIdentifier, setOriginIdentifier] = useState("")
  const [rating, setRating] = useState<Rating | "">("")
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [attachments, setAttachments] = useState<TransferAttachment[]>([])
  const [submitted, setSubmitted] = useState(false)

  const quantity = parseFloat(quantityStr)
  const isQuantityValid = Number.isFinite(quantity) && quantity > 0
  const isOriginValid = originIdentifier.trim().length > 0
  const isCertValid = certifications.length > 0
  const canConfirm =
    !!commodity &&
    isQuantityValid &&
    !!rating &&
    isOriginValid &&
    isCertValid

  const previewAsset = useMemo(
    () =>
      commodity && rating
        ? {
            commodity,
            certifications,
            rating,
          }
        : null,
    [commodity, certifications, rating]
  )

  const validationMessage = !commodity
    ? "Select a commodity."
    : quantityStr.trim() !== "" && !isQuantityValid
      ? "Enter a valid positive quantity in tons."
    : !isQuantityValid
      ? "Enter a positive quantity in tons."
      : !isOriginValid
        ? "Enter an origin identifier or coordinates."
        : !rating
          ? "Select a quality grade."
          : !isCertValid
            ? "Select at least one certification label."
            : null

  function toggleCertification(cert: Certification) {
    setCertifications((current) =>
      current.includes(cert)
        ? current.filter((item) => item !== cert)
        : [...current, cert]
    )
  }

  function handleConfirm() {
    if (!canConfirm || !commodity || !rating) return

    addLot({
      accountId: operationalNodeId,
      commodity,
      quantity,
      rating,
      certifications,
      originIdentifier: originIdentifier.trim(),
      originEvidence:
        attachments.length > 0 ? toOriginEvidence(attachments) : undefined,
    })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close panel"
          >
            <X className="size-4" />
          </button>
          <h2 className="flex-1 text-base font-semibold">Create Lot Position</h2>
        </div>

        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <PackagePlus className="size-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Lot position created</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatTons(quantity)}t of{" "}
              {commodity ? COMMODITY_META[commodity].label : "commodity"} is now
              visible at this operational node.
              {attachments.length > 0
                ? ` ${attachments.length} origin evidence reference${attachments.length === 1 ? "" : "s"} bound by hash.`
                : " Origin metadata is recorded; attach evidence later if needed."}
            </p>
          </div>
          <Button className="mt-2 w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    )
  }

  const StageIcon = nodeAccount
    ? STAGE_META[nodeAccount.stageType].icon
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={onClose}
          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close panel"
        >
          <X className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">Create Lot Position</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Originate a certified commodity lot at your production site.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {nodeAccount ? (
          <div className="space-y-1.5">
            <Label>Operational node</Label>
            <div className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
              {StageIcon ? (
                <StageIcon className="size-3.5 shrink-0 text-muted-foreground" />
              ) : null}
              <span className="font-medium">{nodeAccount.name}</span>
            </div>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="commodity-select">Commodity</Label>
          <Select
            value={commodity}
            onValueChange={(value) => setCommodity(value as CommodityType)}
          >
            <SelectTrigger id="commodity-select" className="w-full">
              <SelectValue placeholder="Select commodity" />
            </SelectTrigger>
            <SelectContent position="popper">
              {COMMODITY_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {COMMODITY_META[option].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lot-quantity">Quantity</Label>
          <div className="relative">
            <input
              id="lot-quantity"
              type="number"
              min={1}
              step={50}
              value={quantityStr}
              onChange={(event) => setQuantityStr(event.target.value)}
              placeholder="0"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 pr-12 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              tons
            </span>
          </div>
          {!isQuantityValid && quantityStr ? (
            <p className="text-xs text-destructive">
              Quantity must be greater than zero.
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="origin-id">Origin identifier / coordinates</Label>
          <input
            id="origin-id"
            type="text"
            value={originIdentifier}
            onChange={(event) => setOriginIdentifier(event.target.value)}
            placeholder="e.g. Huila-CO-LOT-2026-0142"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="grade-select">Quality grade</Label>
          <Select
            value={rating}
            onValueChange={(value) => setRating(value as Rating)}
          >
            <SelectTrigger id="grade-select" className="w-full">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent position="popper">
              {RATING_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  Grade {RATING_META[option].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Certification labels</legend>
          <div className="flex flex-wrap gap-2">
            {CERTIFICATION_OPTIONS.map((cert) => {
              const selected = certifications.includes(cert)
              return (
                <button
                  key={cert}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleCertification(cert)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? CERTIFICATION_META[cert].className
                      : "border-input bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {CERTIFICATION_META[cert].label}
                </button>
              )
            })}
          </div>
          {!isCertValid ? (
            <p className="text-xs text-muted-foreground">
              Select at least one certification for the origin lot.
            </p>
          ) : null}
        </fieldset>

        <CertificateDropzone
          attachments={attachments}
          onChange={setAttachments}
          label="Origin evidence"
          description="Attach origin certificates or supporting documents. Only hashes are bound to custody state — files stay off-ledger."
        />

        <div className="rounded-lg bg-muted px-4 py-3 text-sm">
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Lot summary
          </p>

          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-muted-foreground">Commodity</span>
            <span className="font-medium">
              {commodity ? COMMODITY_META[commodity].label : "—"}
            </span>
          </div>
          <Separator className="my-1" />

          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-muted-foreground">Origin identifier</span>
            <span className="max-w-[55%] truncate font-mono text-xs">
              {originIdentifier.trim() || "—"}
            </span>
          </div>
          <Separator className="my-1" />

          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-muted-foreground">Origin fingerprint</span>
            <span className="font-mono text-xs font-medium">
              {previewAsset ? originFingerprint(previewAsset) : "—"}
            </span>
          </div>
          <Separator className="my-1" />

          <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-muted-foreground">Origin evidence</span>
            <span className="text-xs font-medium">
              {attachments.length > 0
                ? `${attachments.length} hash${attachments.length === 1 ? "" : "es"} ready`
                : "None"}
            </span>
          </div>
          <Separator className="my-1" />

          <div className="flex items-center justify-between py-1.5">
            <span className="font-medium">Total quantity</span>
            <span className="font-semibold">
              {isQuantityValid ? `${formatTons(quantity)}t` : "—"}
            </span>
          </div>
        </div>

        {!canConfirm && validationMessage ? (
          <p className="text-xs text-muted-foreground">{validationMessage}</p>
        ) : null}

        <Button className="w-full" disabled={!canConfirm} onClick={handleConfirm}>
          Confirm lot creation
        </Button>
      </div>
    </div>
  )
}
