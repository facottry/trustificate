import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Convert all external <img> elements inside a container to inline base64
 * data URIs so html2canvas can render them without cross-origin issues.
 * Returns a cleanup function that restores the original src values.
 */
async function inlineExternalImages(
  container: HTMLElement,
): Promise<() => void> {
  const imgs = Array.from(container.querySelectorAll("img")) as HTMLImageElement[];
  const originals: { img: HTMLImageElement; src: string }[] = [];

  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "";
  const token = localStorage.getItem("TRUSTIFICATE:token");

  await Promise.all(
    imgs.map(async (img) => {
      const src = img.src;
      // Skip already-inlined, empty, or same-origin images
      if (!src || src.startsWith("data:")) return;
      try {
        const url = new URL(src, window.location.href);
        if (url.origin === window.location.origin) return;
      } catch {
        return;
      }

      // Strategy 1: direct CORS fetch
      try {
        const resp = await fetch(src, { mode: "cors" });
        if (resp.ok) {
          const blob = await resp.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          originals.push({ img, src });
          img.src = dataUrl;
          return;
        }
      } catch {
        // CORS blocked — fall through to proxy
      }

      // Strategy 2: backend proxy
      try {
        const proxyUrl = `${baseUrl}/api/templates/assets/proxy?url=${encodeURIComponent(src)}`;
        const resp = await fetch(proxyUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (resp.ok) {
          const json = await resp.json();
          if (json.data?.dataUri) {
            originals.push({ img, src });
            img.src = json.data.dataUri;
            return;
          }
        }
      } catch {
        // Proxy also failed — leave image as-is
      }
    }),
  );

  return () => {
    for (const { img, src } of originals) {
      img.src = src;
    }
  };
}

/**
 * Finds the nearest ancestor (starting from parent) that has a CSS scale
 * transform applied, either via Tailwind class or inline style.
 */
function findScaleAncestor(el: HTMLElement): HTMLElement | null {
  let current = el.parentElement;
  while (current && current !== document.body) {
    const cls = current.className || "";
    // Tailwind arbitrary scale: scale-[0.55], scale-[0.6], etc.
    if (/scale-\[/.test(cls)) return current;
    // Tailwind preset scale: scale-50, scale-75, etc.
    if (/\bscale-\d/.test(cls)) return current;
    // Inline transform with scale
    const t = current.style.transform || "";
    if (/scale\(/.test(t)) return current;
    // Computed style check
    const computed = getComputedStyle(current).transform;
    if (computed && computed !== "none") {
      // A non-identity matrix means some transform is applied
      // matrix(a, b, c, d, tx, ty) — if a !== 1 or d !== 1, it's scaled
      const match = computed.match(/matrix\(([^,]+),/);
      if (match && Math.abs(parseFloat(match[1]) - 1) > 0.01) return current;
    }
    current = current.parentElement;
  }
  return null;
}

interface SavedState {
  el: HTMLElement;
  className: string;
  transform: string;
  transformOrigin: string;
  overflow: string;
  height: string;
}

/**
 * Captures the certificate element at full native size by temporarily
 * removing any CSS scale transform on ancestor elements. This operates
 * on the LIVE DOM (no cloning) so all computed styles, flexbox layout,
 * and Tailwind classes are preserved exactly as the browser renders them.
 */
async function captureAtFullSize(
  element: HTMLElement,
  scale: number,
): Promise<HTMLCanvasElement> {
  const saved: SavedState[] = [];
  let restoreImages: (() => void) | null = null;

  // Find the scale wrapper and its parent chain
  const scaleWrapper = findScaleAncestor(element);

  try {
    if (scaleWrapper) {
      // Save and neutralize the scale wrapper
      saved.push({
        el: scaleWrapper,
        className: scaleWrapper.className,
        transform: scaleWrapper.style.transform,
        transformOrigin: scaleWrapper.style.transformOrigin,
        overflow: scaleWrapper.style.overflow,
        height: scaleWrapper.style.height,
      });
      scaleWrapper.className = scaleWrapper.className
        .replace(/scale-\[[^\]]+\]/g, "")
        .replace(/\bscale-\d+\b/g, "");
      scaleWrapper.style.transform = "none";
      scaleWrapper.style.transformOrigin = "top left";

      // Walk up and make all ancestors allow overflow so the full-size
      // element isn't clipped during capture
      let ancestor = scaleWrapper.parentElement;
      while (ancestor && ancestor !== document.body) {
        const cs = getComputedStyle(ancestor);
        if (cs.overflow !== "visible" || cs.overflowX !== "visible" || cs.overflowY !== "visible") {
          saved.push({
            el: ancestor,
            className: ancestor.className,
            transform: ancestor.style.transform,
            transformOrigin: ancestor.style.transformOrigin,
            overflow: ancestor.style.overflow,
            height: ancestor.style.height,
          });
          ancestor.style.overflow = "visible";
          ancestor.style.height = "auto";
        }
        ancestor = ancestor.parentElement;
      }
    }

    // Wait for browser to re-layout at full size
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));

    // Convert external images to base64 so html2canvas can render them
    restoreImages = await inlineExternalImages(element);

    // Wait one more frame for the inlined images to settle
    await new Promise((r) => requestAnimationFrame(r));

    // The CertificateRenderer has explicit width/height in its style attribute
    // (595px or 842px). scrollWidth/scrollHeight reflect these regardless of
    // CSS transforms, so they're always the true layout dimensions.
    const width = element.scrollWidth;
    const height = element.scrollHeight;

    // Capture with html2canvas at the element's full native size
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: null,
      allowTaint: false,
      imageTimeout: 15000,
      width,
      height,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      // Prevent html2canvas from using window scroll offsets
      windowWidth: width,
      windowHeight: height,
    });

    return canvas;
  } finally {
    // Restore inlined images to their original URLs
    if (restoreImages) restoreImages();

    // Restore all modified elements in reverse order
    for (let i = saved.length - 1; i >= 0; i--) {
      const s = saved[i];
      s.el.className = s.className;
      s.el.style.transform = s.transform;
      s.el.style.transformOrigin = s.transformOrigin;
      s.el.style.overflow = s.overflow;
      s.el.style.height = s.height;
    }
  }
}

export async function generatePDF(
  element: HTMLElement,
  filename: string = "certificate.pdf",
) {
  const scale = 3;
  const canvas = await captureAtFullSize(element, scale);
  const imgData = canvas.toDataURL("image/png", 1.0);

  // CertificateRenderer uses fixed px: 595×842 (portrait) or 842×595 (landscape).
  // Convert CSS px to mm: 1 CSS px = 25.4/96 mm.
  const pxToMm = 25.4 / 96;
  const pageWidthMm = element.scrollWidth * pxToMm;
  const pageHeightMm = element.scrollHeight * pxToMm;
  const isLandscape = element.scrollWidth > element.scrollHeight;

  const pdf = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "mm",
    format: [pageWidthMm, pageHeightMm],
    compress: true,
  });

  pdf.setProperties({
    title: filename.replace(".pdf", ""),
    creator: "TRUSTIFICATE",
  });

  pdf.addImage(imgData, "PNG", 0, 0, pageWidthMm, pageHeightMm);
  pdf.save(filename);
}

export async function generatePDFBlob(
  element: HTMLElement,
  filename: string = "certificate.pdf",
): Promise<Blob> {
  const scale = 3;
  const canvas = await captureAtFullSize(element, scale);
  const imgData = canvas.toDataURL("image/png", 1.0);

  const pxToMm = 25.4 / 96;
  const pageWidthMm = element.scrollWidth * pxToMm;
  const pageHeightMm = element.scrollHeight * pxToMm;
  const isLandscape = element.scrollWidth > element.scrollHeight;

  const pdf = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "mm",
    format: [pageWidthMm, pageHeightMm],
    compress: true,
  });

  pdf.setProperties({
    title: filename.replace(".pdf", ""),
    creator: "TRUSTIFICATE",
  });

  pdf.addImage(imgData, "PNG", 0, 0, pageWidthMm, pageHeightMm);
  return pdf.output("blob");
}

export async function generatePNG(
  element: HTMLElement,
  filename: string = "certificate.png",
) {
  const scale = 3;
  const canvas = await captureAtFullSize(element, scale);

  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png", 1.0);
  link.click();
}
