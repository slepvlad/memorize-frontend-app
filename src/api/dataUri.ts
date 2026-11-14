// Avatar and audio bytes both sit behind the JWT, so neither can be loaded by
// URL — <Image> and the audio player get a data URI instead.
export function toDataUri(buffer: ArrayBuffer, contentType: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `data:${contentType};base64,${btoa(binary)}`;
}
