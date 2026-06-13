import { describe, expect, it } from "vitest"

import {
  CUSTODY_ROUTE,
  custodyRouteIndex,
  suggestNextCustodyStep,
} from "@/lib/demo/custody-route"

describe("custody route ordering", () => {
  it("orders nodes from production to destination port", () => {
    expect(CUSTODY_ROUTE).toEqual([
      "production-site",
      "truck-transport",
      "silo",
      "railway-transport",
      "origin-port",
      "ship",
      "destination-port",
    ])
  })

  it("returns the index of a node along the route", () => {
    expect(custodyRouteIndex("silo")).toBe(2)
    expect(custodyRouteIndex("not-a-node")).toBe(-1)
  })
})

describe("suggestNextCustodyStep", () => {
  it("suggests the next hop along the route", () => {
    expect(suggestNextCustodyStep("silo")).toBe("railway-transport")
    expect(suggestNextCustodyStep("ship")).toBe("destination-port")
  })

  it("returns null at the end of the route", () => {
    expect(suggestNextCustodyStep("destination-port")).toBeNull()
  })

  it("returns null for off-route nodes", () => {
    expect(suggestNextCustodyStep("certchain-verifier")).toBeNull()
  })
})
