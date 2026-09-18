/**
 * Robust DOCX text extraction preserving paragraph breaks and text runs
 */
function xmlToDocxLines(xml: string): string[] {
  const cleanXml = xml
    .replace(/<\/w:tc>/gi, "\n")
    .replace(/<\/w:tr>/gi, "\n")
    .replace(/<\/w:p>/gi, "\n")
    .replace(/<w:br[^>]*>/gi, "\n")
    .replace(/<w:cr[^>]*>/gi, "\n")
    .replace(/<w:tab[^>]*>/gi, " ")
    .replace(/<\/w:r>/gi, " ")
    .replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

  return cleanXml
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * Extracts plain text from DOCX files using browser-native zip extraction
 */
export async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const textDecoder = new TextDecoder("utf-8");

    for (let i = 0; i < bytes.length - 30; i++) {
      if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x03 && bytes[i + 3] === 0x04) {
        const compMethod = bytes[i + 8] | (bytes[i + 9] << 8);
        const compSize = bytes[i + 18] | (bytes[i + 19] << 8) | (bytes[i + 20] << 16) | (bytes[i + 21] << 24);
        const nameLen = bytes[i + 26] | (bytes[i + 27] << 8);
        const extraLen = bytes[i + 28] | (bytes[i + 29] << 8);
        const nameBytes = bytes.subarray(i + 30, i + 30 + nameLen);
        const fileName = textDecoder.decode(nameBytes).toLowerCase().replace(/\\/g, "/");

        if (fileName === "word/document.xml") {
          const dataStart = i + 30 + nameLen + extraLen;
          let dataEnd = dataStart + compSize;

          if (!compSize || compSize <= 0 || dataEnd > bytes.length) {
            let nextPk = bytes.length;
            for (let j = dataStart; j < bytes.length - 4; j++) {
              if (bytes[j] === 0x50 && bytes[j + 1] === 0x4b && (bytes[j + 2] === 0x03 || bytes[j + 2] === 0x01 || bytes[j + 2] === 0x07)) {
                nextPk = j;
                break;
              }
            }
            dataEnd = nextPk;
          }

          const compressedData = bytes.subarray(dataStart, dataEnd);
          let xml = "";

          if (compMethod === 8 && typeof DecompressionStream !== "undefined") {
            try {
              const stream = new Response(compressedData).body?.pipeThrough(new DecompressionStream("deflate-raw"));
              xml = (await new Response(stream).text()) || "";
            } catch {
              try {
                const stream = new Response(compressedData).body?.pipeThrough(new DecompressionStream("deflate"));
                xml = (await new Response(stream).text()) || "";
              } catch {
                // Fallback to textDecoder
              }
            }
          }
          if (!xml) {
            xml = textDecoder.decode(compressedData);
          }

          const lines = xmlToDocxLines(xml);
          return lines.join("\n");
        }
      }
    }
  } catch (err) {
    console.warn("DOCX extraction fallback:", err);
  }
  return "";
}
