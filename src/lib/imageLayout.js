import { imageWidth } from './noteDocument.js';

const key = image => String(image.screenshotId ?? image.id);
const width = image => imageWidth(image.width ?? image.display_width ?? 100);

// Legacy notes have no explicit breaks and retain their natural wrapping.
export function imageRows(images = []) {
  const rows = [];
  let total = 0;
  for (const image of images) {
    const size = width(image);
    if (!rows.length || image.startRow || total + size > 100) {
      rows.push([]);
      total = 0;
    }
    rows.at(-1).push(image);
    total += size;
  }
  return rows;
}
export function flattenImageRows(rows) {
  return rows.filter(row => row.length).flatMap(row => row.map((image,index) => ({...image,startRow:index === 0})));
}
export function serializeImageLayout(images) {
  return imageRows(images).map(row => row.filter(image => image.screenshotId != null).map(key)).filter(row => row.length);
}
export function restoreImageLayout(images, layout) {
  if (!Array.isArray(layout)) return images;
  const available = new Map(images.map(image => [key(image),image]));
  const rows = [];
  for (const row of layout) {
    if (!Array.isArray(row)) continue;
    const restored = [];
    for (const id of row) {
      const image = available.get(String(id));
      if (image) { restored.push(image);available.delete(String(id)); }
    }
    if (restored.length) rows.push(restored);
  }
  // Keep unreferenced images, including uploads from older clients.
  return [...flattenImageRows(rows),...Array.from(available.values(),image => ({...image,startRow:true}))];
}
export function imageSectionOwners(sections = []) {
  const owners = new Map();
  for (const section of sections) {
    if (!Array.isArray(section.image_layout)) continue;
    for (const row of section.image_layout) {
      if (!Array.isArray(row)) continue;
      for (const id of row) if ((typeof id === 'string' || typeof id === 'number') && !owners.has(String(id))) owners.set(String(id),section.id);
    }
  }
  return owners;
}

// Target placements are relative to its row for Above/Below, and to the image
// for Left/Right. Metadata and files stay on the same image object.
export function placeImage(sections, source, target) {
  const from = sections.find(section => section.id === source.sectionId);
  const to = sections.find(section => section.id === target.sectionId);
  const moving = from?.images.find(image => String(image.id) === String(source.imageId));
  if (!moving || !to || (from === to && String(target.imageId) === String(source.imageId))) return {sections,changed:false};
  const layouts = new Map(sections.map(section => [section.id,imageRows(section.images).map(row => row.filter(image => section !== from || image !== moving)).filter(row => row.length)]));
  const rows = layouts.get(to.id);
  if (target.imageId == null) rows.push([moving]);
  else {
    const rowIndex = rows.findIndex(row => row.some(image => String(image.id) === String(target.imageId)));
    if (rowIndex < 0) return {sections,changed:false};
    const row = rows[rowIndex];
    if (target.placement === 'above' || target.placement === 'below') rows.splice(rowIndex + (target.placement === 'below' ? 1 : 0),0,[moving]);
    else if (target.placement === 'left' || target.placement === 'right') {
      if (row.length >= 4) return {sections,changed:false,full:true};
      const index = row.findIndex(image => String(image.id) === String(target.imageId));
      row.splice(index + (target.placement === 'right' ? 1 : 0),0,moving);
      if (row.reduce((sum,image) => sum + width(image),0) > 100) {
        const size = Math.floor(100 / row.length);
        rows[rowIndex] = row.map((image,i) => ({...image,width:i === row.length-1 ? 100-size*i : size}));
      }
    } else return {sections,changed:false};
  }
  return {sections:sections.map(section => section === from || section === to ? {...section,images:flattenImageRows(layouts.get(section.id))} : section),changed:true};
}
