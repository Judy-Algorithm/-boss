// Extract embedded textures so the native loader never needs Blob URLs or browser image APIs.
export function unpackGLB(input, id) {
  if (input.readUInt32LE(0) !== 0x46546c67 || input.readUInt32LE(4) !== 2) throw Error(`Invalid GLB: ${id}`);
  const jsonLength = input.readUInt32LE(12);
  const json = JSON.parse(input.subarray(20, 20 + jsonLength).toString());
  const bin = input.subarray(28 + jsonLength);
  const images = [];
  const imageViews = new Set();
  for (const [index, image] of (json.images || []).entries()) {
    if (image.bufferView === undefined) throw Error(`Expected embedded texture: ${id}`);
    const view = json.bufferViews[image.bufferView];
    const ext = image.mimeType === 'image/jpeg' ? 'jpg' : image.mimeType === 'image/png' ? 'png' : null;
    if (!ext) throw Error(`Unsupported texture: ${id}`);
    const name = `${id}-${index}.${ext}`;
    images.push({name, bytes: bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength)});
    imageViews.add(image.bufferView);
    delete image.bufferView;
    image.uri = name;
  }
  let offset = 0;
  const chunks = json.bufferViews.map((view, index) => {
    if (view.buffer !== 0) throw Error('Only single-buffer GLB assets are supported');
    const bytes = imageViews.has(index) ? Buffer.alloc(4) : bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
    view.byteOffset = offset; view.byteLength = bytes.length;
    const padded = Buffer.alloc(Math.ceil(bytes.length / 4) * 4); bytes.copy(padded); offset += padded.length;
    return padded;
  });
  json.buffers = [{byteLength: offset}];
  const raw = Buffer.from(JSON.stringify(json)), paddedJSON = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 32);
  raw.copy(paddedJSON);
  const binary = Buffer.concat(chunks), header = Buffer.alloc(20), binHeader = Buffer.alloc(8);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + paddedJSON.length + binary.length, 8);
  header.writeUInt32LE(paddedJSON.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  binHeader.writeUInt32LE(binary.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
  return {glb: Buffer.concat([header, paddedJSON, binHeader, binary]), images};
}
