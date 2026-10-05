import * as pdfjsLib from "pdfjs-dist";
import { createWorker } from "tesseract.js";

/**
 * Performs OCR text recognition on an image file, blob, or canvas.
 */
export async function performOcrOnImage(
  imageSource: File | Blob | HTMLCanvasElement | ImageData
): Promise<string> {
  let worker: any = null;
  try {
    worker = await createWorker("eng");
    const ret = await worker.recognize(imageSource);
    return ret?.data?.text || "";
  } catch (err) {
    console.warn("OCR recognition error on image:", err);
    return "";
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        // ignore cleanup error
      }
    }
  }
}

/**
 * Performs OCR fallback on scanned/image-only PDF documents by rendering pages to canvas.
 */
export async function performOcrOnPdfPages(
  file: File,
  maxPages: number = 5
): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;

    const pageCount = Math.min(pdfDoc.numPages, maxPages);
    let combinedText = "";

    let worker: any = null;
    try {
      worker = await createWorker("eng");

      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for crisp OCR text recognition

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext as any).promise;

        const result = await worker.recognize(canvas);
        const pageText = result?.data?.text || "";
        if (pageText.trim()) {
          combinedText += pageText.trim() + "\n\n";
        }
      }
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch (e) {
          // ignore cleanup error
        }
      }
    }

    return combinedText.trim();
  } catch (err) {
    console.warn("OCR fallback error on PDF pages:", err);
    return "";
  }
}
