const MAX_AVATAR_BYTES = 200 * 1024;
const MAX_DIMENSION = 256;

export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP).");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Ảnh tối đa 5MB.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Không thể xử lý ảnh.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.85;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > MAX_AVATAR_BYTES * 1.37 && quality > 0.4) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  if (dataUrl.length > MAX_AVATAR_BYTES * 1.37) {
    throw new Error("Ảnh quá lớn sau khi nén. Hãy chọn ảnh nhỏ hơn.");
  }
  return dataUrl;
}
