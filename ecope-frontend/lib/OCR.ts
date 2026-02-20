// import Tesseract from "tesseract.js";

// export async function performUniversalOCR(buffer: Buffer | ArrayBuffer): Promise<string> {
//   try {
//     const data = await Tesseract.recognize(new Uint8Array(buffer), "eng", {
//       logger: (m) => console.log(m), // optional, see progress
//     });
//     return data.data.text;
//   } catch (error) {
//     console.error("OCR error:", error);
//     throw new Error("OCR processing failed");
//   }
// }