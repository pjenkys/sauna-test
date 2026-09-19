import fs from 'fs';
import path from 'path';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || 'figd_xB0AyEiQ4I8RyX21GFxEbWXwsF115e_iUltEcQ9L';

export async function fetchFigmaFile(fileKey) {
  const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN }
  });
  if (!res.ok) {
    throw new Error(`Figma API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchFigmaNodes(fileKey, nodeIds) {
  const ids = Array.isArray(nodeIds) ? nodeIds.join(',') : nodeIds;
  const res = await fetch(`https://api.figma.com/v1/files/${fileKey}/nodes?ids=${ids}`, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN }
  });
  if (!res.ok) {
    throw new Error(`Figma API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchFigmaImage(fileKey, nodeIds, format = 'svg') {
  const ids = Array.isArray(nodeIds) ? nodeIds.join(',') : nodeIds;
  const res = await fetch(`https://api.figma.com/v1/images/${fileKey}?ids=${ids}&format=${format}`, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN }
  });
  if (!res.ok) {
    throw new Error(`Figma API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
