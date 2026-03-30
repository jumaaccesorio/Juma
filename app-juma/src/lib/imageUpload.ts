export type UploadImageVariant = "product_thumb" | "product_card" | "product_full" | "panel" | "hero";

type VariantPreset = {
  maxWidth: number;
  quality: number;
};

const VARIANT_PRESETS: Record<UploadImageVariant, VariantPreset> = {
  product_thumb: { maxWidth: 240, quality: 0.72 },
  product_card: { maxWidth: 520, quality: 0.76 },
  product_full: { maxWidth: 1200, quality: 0.82 },
  panel: { maxWidth: 1100, quality: 0.82 },
  hero: { maxWidth: 1400, quality: 0.82 },
};

function loadImageFromUrl(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));
    image.src = url;
  });
}

async function decodeImage(file: Blob) {
  if ("createImageBitmap" in window) {
    try {
      return await window.createImageBitmap(file);
    } catch {
      // Fallback below for browsers that expose the API but fail decoding.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    return await loadImageFromUrl(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("No se pudo convertir la imagen."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("No se pudo convertir la imagen."));
    reader.readAsDataURL(blob);
  });
}

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("No se pudo optimizar la imagen."));
      },
      "image/webp",
      quality,
    );
  });
}

export async function optimizeImageFile(file: File, variant: UploadImageVariant): Promise<File> {
  const preset = VARIANT_PRESETS[variant];
  const image = await decodeImage(file);
  const sourceWidth = "width" in image ? image.width : 0;
  const sourceHeight = "height" in image ? image.height : 0;
  const scale = sourceWidth > 0 ? Math.min(1, preset.maxWidth / sourceWidth) : 1;
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo preparar la imagen para subir.");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  const optimizedBlob = await canvasToBlob(canvas, preset.quality);
  const nextName = `${file.name.replace(/\.[^.]+$/, "") || "imagen"}.webp`;

  return new File([optimizedBlob], nextName, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

export async function dataUrlToOptimizedFile(dataUrl: string, variant: UploadImageVariant, filenameBase: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const sourceType = blob.type || "image/jpeg";
  const extension = sourceType.split("/")[1] || "jpg";
  const tempFile = new File([blob], `${filenameBase}.${extension}`, {
    type: sourceType,
    lastModified: Date.now(),
  });

  return optimizeImageFile(tempFile, variant);
}

export async function optimizeFileForPreview(file: File, variant: UploadImageVariant) {
  const optimized = await optimizeImageFile(file, variant);
  const previewUrl = await blobToDataUrl(optimized);
  return { optimized, previewUrl };
}

export async function optimizeProductImageVariants(file: File) {
  const [thumb, card, full] = await Promise.all([
    optimizeImageFile(file, "product_thumb"),
    optimizeImageFile(file, "product_card"),
    optimizeImageFile(file, "product_full"),
  ]);

  return { thumb, card, full };
}
