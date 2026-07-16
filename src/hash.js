import sharp from "sharp";

// 64-bit difference hash: perceptual near-duplicate detection with zero dependencies beyond sharp.
export async function dHash(filePath) {
  const { data } = await sharp(filePath).grayscale().resize(9, 8, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  let bits = "";
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++)
      bits += data[y * 9 + x] < data[y * 9 + x + 1] ? "1" : "0";
  return BigInt("0b" + bits).toString(16).padStart(16, "0");
}

export function hamming(hexA, hexB) {
  let x = BigInt("0x" + hexA) ^ BigInt("0x" + hexB), c = 0n;
  while (x) { c += x & 1n; x >>= 1n; }
  return Number(c);
}
