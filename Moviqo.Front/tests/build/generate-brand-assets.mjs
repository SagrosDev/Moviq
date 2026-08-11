import { readFile, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";

const iconSize = 32;
const sampleScale = 4;
const brandColor = [15, 118, 110];
const markColor = [255, 255, 255];
const pathSegments = [
  [[7.5, 16], [12, 16]],
  [[20, 16], [21.5, 16]],
  [[21.5, 16], [24.5, 9.5]],
  [[21.5, 16], [24.5, 22.5]],
  [[16, 11.5], [20, 16]],
  [[20, 16], [16, 20.5]],
  [[16, 20.5], [12, 16]],
  [[12, 16], [16, 11.5]]
];
const workflowNodes = [
  [7.5, 16],
  [24.5, 9.5],
  [24.5, 22.5]
];

const squaredDistanceToSegment = (x, y, [startX, startY], [endX, endY]) => {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;
  const projection = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((x - startX) * deltaX + (y - startY) * deltaY) / lengthSquared));
  const nearestX = startX + projection * deltaX;
  const nearestY = startY + projection * deltaY;
  return (x - nearestX) ** 2 + (y - nearestY) ** 2;
};

const isInsideRoundedSquare = (x, y) => {
  const cornerRadius = 8;
  const inset = iconSize / 2 - cornerRadius;
  const outsideX = Math.max(Math.abs(x - iconSize / 2) - inset, 0);
  const outsideY = Math.max(Math.abs(y - iconSize / 2) - inset, 0);
  return outsideX * outsideX + outsideY * outsideY <= cornerRadius * cornerRadius;
};

const isInsideWorkflowMark = (x, y) => {
  const lineRadiusSquared = (2.25 / 2) ** 2;
  const nodeRadiusSquared = 1.75 ** 2;
  const touchesLine = pathSegments.some(([start, end]) =>
    squaredDistanceToSegment(x, y, start, end) <= lineRadiusSquared
  );
  const touchesNode = workflowNodes.some(([nodeX, nodeY]) =>
    (x - nodeX) ** 2 + (y - nodeY) ** 2 <= nodeRadiusSquared
  );
  return touchesLine || touchesNode;
};

const renderIconPixels = () => {
  const pixels = Buffer.alloc(iconSize * iconSize * 4);
  const samplesPerPixel = sampleScale * sampleScale;

  for (let pixelY = 0; pixelY < iconSize; pixelY += 1) {
    for (let pixelX = 0; pixelX < iconSize; pixelX += 1) {
      let alphaTotal = 0;
      let redTotal = 0;
      let greenTotal = 0;
      let blueTotal = 0;

      for (let sampleY = 0; sampleY < sampleScale; sampleY += 1) {
        for (let sampleX = 0; sampleX < sampleScale; sampleX += 1) {
          const x = pixelX + (sampleX + 0.5) / sampleScale;
          const y = pixelY + (sampleY + 0.5) / sampleScale;
          if (!isInsideRoundedSquare(x, y)) {
            continue;
          }

          const [red, green, blue] = isInsideWorkflowMark(x, y) ? markColor : brandColor;
          alphaTotal += 255;
          redTotal += red * 255;
          greenTotal += green * 255;
          blueTotal += blue * 255;
        }
      }

      const offset = (pixelY * iconSize + pixelX) * 4;
      const alpha = Math.round(alphaTotal / samplesPerPixel);
      pixels[offset] = alphaTotal ? Math.round(redTotal / alphaTotal) : 0;
      pixels[offset + 1] = alphaTotal ? Math.round(greenTotal / alphaTotal) : 0;
      pixels[offset + 2] = alphaTotal ? Math.round(blueTotal / alphaTotal) : 0;
      pixels[offset + 3] = alpha;
    }
  }

  return pixels;
};

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const pngChunk = (type, data = Buffer.alloc(0)) => {
  const typeBuffer = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return chunk;
};

const createPng = () => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(iconSize, 0);
  header.writeUInt32BE(iconSize, 4);
  header[8] = 8;
  header[9] = 6;

  const pixels = renderIconPixels();
  const scanlines = Buffer.alloc((iconSize * 4 + 1) * iconSize);
  for (let row = 0; row < iconSize; row += 1) {
    const scanlineOffset = row * (iconSize * 4 + 1);
    scanlines[scanlineOffset] = 0;
    pixels.copy(scanlines, scanlineOffset + 1, row * iconSize * 4, (row + 1) * iconSize * 4);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(scanlines)),
    pngChunk("IEND")
  ]);
};

const createIco = () => {
  const png = createPng();
  const directory = Buffer.alloc(22);
  directory.writeUInt16LE(0, 0);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(1, 4);
  directory[6] = iconSize;
  directory[7] = iconSize;
  directory.writeUInt16LE(1, 10);
  directory.writeUInt16LE(32, 12);
  directory.writeUInt32LE(png.length, 14);
  directory.writeUInt32LE(directory.length, 18);
  return Buffer.concat([directory, png]);
};

const faviconPath = new URL("../../public/favicon.ico", import.meta.url);
const expectedFavicon = createIco();

if (process.argv.includes("--write")) {
  await writeFile(faviconPath, expectedFavicon);
} else {
  const currentFavicon = await readFile(faviconPath).catch(() => Buffer.alloc(0));
  if (!currentFavicon.equals(expectedFavicon)) {
    throw new Error("public/favicon.ico is stale. Run npm run generate:brand-assets.");
  }
}
