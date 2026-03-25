const MAX_BYTES = 390;

function sliceByBytes(str, maxBytes) {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.codePointAt(i);
    const charBytes = code > 0xFFFF ? 4 : code > 0x7FF ? 3 : code > 0x7F ? 2 : 1;
    if (len + charBytes > maxBytes) return i;
    len += charBytes;
    if (code > 0xFFFF) i++; // skip surrogate pair
  }
  return str.length;
}

export function splitMessage(text, maxBytes = MAX_BYTES) {
  const rawLines = text.replace(/\r/g, '').split('\n');
  const result = [];
  for (const line of rawLines) {
    if (line.trim() === '') continue;
    let remaining = line;
    while (Buffer.byteLength(remaining, 'utf8') > maxBytes) {
      const cutMax = sliceByBytes(remaining, maxBytes);
      const slice = remaining.slice(0, cutMax);
      const lastSpace = slice.lastIndexOf(' ');
      const cutPoint = lastSpace > cutMax * 0.3 ? lastSpace : cutMax;
      result.push(remaining.slice(0, cutPoint));
      remaining = remaining.slice(cutPoint).trimStart();
    }
    if (remaining.trim()) {
      result.push(remaining);
    }
  }
  return result;
}
