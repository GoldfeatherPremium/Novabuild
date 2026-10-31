declare module "mammoth" {
  interface MammothResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }
  interface Mammoth {
    extractRawText(input: { buffer: Buffer }): Promise<MammothResult>;
    convertToHtml(input: { buffer: Buffer }): Promise<MammothResult>;
  }
  const mammoth: Mammoth;
  export default mammoth;
}
