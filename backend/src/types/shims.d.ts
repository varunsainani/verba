declare module "mammoth" {
  interface MammothResult {
    value: string;
    messages: unknown[];
  }
  export function extractRawText(input: { buffer: Buffer }): Promise<MammothResult>;
  const _default: { extractRawText: typeof extractRawText };
  export default _default;
}
