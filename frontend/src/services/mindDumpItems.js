import { apiRequest } from "./api";

function itemEndpoint(dumpId, itemId) {
  if (!dumpId || !itemId) {
    throw new Error("Impossibile identificare l'impegno.");
  }

  return `/api/mind-dumps/${encodeURIComponent(dumpId)}/items/${encodeURIComponent(itemId)}`;
}

export async function updateMindDumpItem({ item, changes, token }) {
  const itemId = item?.id;
  const response = await apiRequest(itemEndpoint(item?.source?.mindDumpId, itemId), {
    method: "PATCH",
    token,
    body: JSON.stringify(changes),
  });

  if (String(response?.item?._id) !== String(itemId)) {
    throw new Error("Il server non ha confermato la modifica.");
  }

  if (changes.status && response.item.status !== changes.status) {
    throw new Error("Il server non ha confermato il nuovo stato.");
  }

  return response.item;
}

export async function deleteMindDumpItem({ dumpId, itemId, token }) {
  const response = await apiRequest(itemEndpoint(dumpId, itemId), {
    method: "DELETE",
    token,
  });

  if (response?.removedDump !== false) {
    throw new Error("Il server non ha confermato l’eliminazione dell’elemento.");
  }
}
