export function getAssetUrl(moduleUrl, relativePath) {
  return new URL(relativePath, moduleUrl).toString();
}
