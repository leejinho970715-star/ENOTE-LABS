import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';

// Keep the orange document symbol, with no background plate or white canvas.
const root = new URL('../', import.meta.url);
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M15 6h27l12 12v40H15zM42 6v12h12M24 29h20M24 40h15" fill="none" stroke="#c4541b" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const png = await sharp(Buffer.from(svg)).resize(32, 32).png().toBuffer();
const apple = await sharp(Buffer.from(svg)).resize(180, 180).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header[6] = 32; header[7] = 32;
header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14); header.writeUInt32LE(22, 18);
for (const folder of ['demos/weekly-report/assets/', 'marketing/assets/']) {
  await writeFile(new URL(folder + 'favicon-32.png', root), png);
  await writeFile(new URL(folder + 'apple-touch-icon.png', root), apple);
  await writeFile(new URL(folder + 'favicon.ico', root), Buffer.concat([header, png]));
}
await writeFile(new URL('demos/weekly-report/assets/flownote-favicon.svg', root), svg);
await writeFile(new URL('marketing/favicon.svg', root), svg);
console.log('Flownote transparent SVG, PNG, ICO and touch icon generated.');
