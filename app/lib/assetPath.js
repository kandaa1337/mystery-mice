export const assetPrefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const assetPath = (path = "") => {
  if (!path) return assetPrefix;
  return path.startsWith("/") ? `${assetPrefix}${path}` : `${assetPrefix}/${path}`;
};