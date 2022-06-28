export function base64ToArrayBuffer(string: string): ArrayBuffer {
  const buffer = globalThis.__AppServiceNativeSDK.base64.base64ToArrayBuffer(string)
  return Uint8Array.from(buffer).buffer
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return globalThis.__AppServiceNativeSDK.base64.arrayBufferToBase64(new Uint8Array(buffer))
}
