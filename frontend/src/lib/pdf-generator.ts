import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function generatePDF(element: HTMLElement, filename: string = "certificate.pdf") {
  // Use high scale for crisp rasterization
  const scale = 4;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: null,
    allowTaint: false,
    imageTimeout: 0,
    removeContainer: true,
  });

  // Use uncompressed PNG data to preserve every pixel
  const imgData = canvas.toDataURL("image/png", 1.0);

  // Match PDF page size exactly to the element's CSS dimensions (in mm at 72 DPI)
  const pxToMm = 25.4 / 72; // 1 CSS px â‰ˆ 0.3528 mm at 72 DPI
  const pageWidthMm = element.offsetWidth * pxToMm;
  const pageHeightMm = element.offsetHeight * pxToMm;

  const isLandscape = element.offsetWidth > element.offsetHeight;
  const orientation = isLandscape ? "landscape" : "portrait";

  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: [pageWidthMm, pageHeightMm],
    compress: false,
  });

  // Set PDF properties for print-quality output
  pdf.setProperties({
    title: filename.replace(".pdf", ""),
    creator: "TRUSTIFICATE",
  });

  // Add image at full page size with NO compression for maximum quality
  pdf.addImage(
    imgData,
    "PNG",
    0,
    0,
    pageWidthMm,
    pageHeightMm,
    undefined,
    "NONE"
  );

  pdf.save(filename);
}

export async function generatePNG(element: HTMLElement, filename: string = "certificate.png") {
  const scale = 4;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: null,
    allowTaint: false,
  });

  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png", 1.0);
  link.click();
}

