import cloudinary from "../config/cloudinary.js";

const PRODUCT_FOLDER = "products";

// Cloudinary accepts base64 data URIs, so uploads stay in memory and work on serverless hosts.
const toDataUri = (file) => `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

/**
 * @param {Array<{ mimetype: string, buffer: Buffer }>} files
 * @returns {Promise<Array<{ url: string, publicId: string }>>}
 */
export async function uploadProductImages(files = []) {
  const uploaded = await Promise.all(
    files.map((file) =>
      cloudinary.uploader.upload(toDataUri(file), {
        folder: PRODUCT_FOLDER,
        resource_type: "image",
      })
    )
  );

  return uploaded.map((result) => ({ url: result.secure_url, publicId: result.public_id }));
}

// Works for both stored public IDs (products/abc) and legacy secure URLs.
export function publicIdFromImageUrl(imageUrl) {
  if (typeof imageUrl !== "string") return null;

  const marker = "/image/upload/";
  const markerIndex = imageUrl.indexOf(marker);
  if (markerIndex === -1) return null;

  return imageUrl
    .slice(markerIndex + marker.length)
    .split(/[?#]/)[0]
    .replace(/^v\d+\//, "")
    .replace(/\.[^/.]+$/, "");
}

export async function destroyProductImages(images = []) {
  const publicIds = images
    .map((image) => (typeof image === "string" ? publicIdFromImageUrl(image) : image?.publicId))
    .filter(Boolean);

  // Cleanup must never prevent the database operation that follows it.
  await Promise.allSettled(publicIds.map((publicId) => cloudinary.uploader.destroy(publicId)));
}
