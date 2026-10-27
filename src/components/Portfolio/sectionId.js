export function sectionId(item) {
  const slug = (item.sectionName || item.type || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || item.id;
}
