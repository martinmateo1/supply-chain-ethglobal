import { describe, expect, it } from "vitest"

import { canonicalHash, canonicalize, sha256Hex } from "@/lib/demo/canonical-hash"

describe("sha256Hex", () => {
  it("matches the FIPS 180-4 test vector for 'abc'", () => {
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    )
  })

  it("matches the empty-string vector", () => {
    expect(sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    )
  })

  it("matches a >55 byte message (multi-block padding)", () => {
    expect(
      sha256Hex(
        "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"
      )
    ).toBe("248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1")
  })
})

describe("canonicalize", () => {
  it("is stable regardless of key order", () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe(canonicalize({ a: 2, b: 1 }))
  })

  it("preserves array order", () => {
    expect(canonicalize([1, 2, 3])).not.toBe(canonicalize([3, 2, 1]))
  })

  it("drops undefined fields", () => {
    expect(canonicalize({ a: 1, b: undefined })).toBe(canonicalize({ a: 1 }))
  })
})

describe("canonicalHash", () => {
  it("is deterministic for structurally-equal inputs", () => {
    expect(canonicalHash({ a: 1, b: [2, 3] })).toBe(
      canonicalHash({ b: [2, 3], a: 1 })
    )
  })

  it("changes when any value changes", () => {
    expect(canonicalHash({ a: 1 })).not.toBe(canonicalHash({ a: 2 }))
  })
})
