declare module "pdf-parse/lib/pdf-parse.js" {
  const pdfParse: (dataBuffer: Buffer, options?: unknown) => Promise<{
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    version: string;
    text: string;
  }>;

  export default pdfParse;
}
