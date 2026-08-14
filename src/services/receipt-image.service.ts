namespace ReceiptRing.Services {
  // Phone photos arrive at several megapixels — far more than the history view
  // ever shows, and more than the save endpoint will accept. Every receipt
  // image is re-encoded down to a bounded JPEG before it is carried around as
  // a data URL, so a saved receipt costs a few hundred kilobytes, not several
  // megabytes.
  const MAX_DIMENSION = 1600;
  const JPEG_QUALITY = 0.82;

  export class ReceiptImageService {
    // Returns null when the image can't be decoded: a photo we can't process
    // must not stop the receipt itself from being saved.
    async toStorableDataUrl(file: File): Promise<string | null> {
      try {
        const source = await this.decode(file);
        const scale = Math.min(1, MAX_DIMENSION / Math.max(source.width, source.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(source.width * scale));
        canvas.height = Math.max(1, Math.round(source.height * scale));

        const context = canvas.getContext("2d");
        if (!context) return null;
        context.drawImage(source, 0, 0, canvas.width, canvas.height);

        if ("close" in source) {
          source.close();
        }
        return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      } catch (error) {
        console.error("Could not prepare the receipt image for saving:", error);
        return null;
      }
    }

    // createImageBitmap applies the EXIF orientation, so a photo taken sideways
    // is stored the way it was shot. Older browsers without it fall back to an
    // <img>, which at worst keeps the camera's own orientation.
    private async decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
      if (typeof createImageBitmap === "function") {
        return createImageBitmap(file, { imageOrientation: "from-image" });
      }

      const url = URL.createObjectURL(file);
      try {
        return await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error("Could not decode the image."));
          image.src = url;
        });
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  }
}
