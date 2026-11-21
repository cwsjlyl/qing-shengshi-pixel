declare global {
  interface Window {
    __CLASSROOM_PROD__?: boolean;
    __WEBP_ASSET_MAP__?: Record<string, string>;
  }
}

let webpSupported = false;
let detectionPromise: Promise<boolean> | null = null;

// 26-byte 1x1 lossless WebP test vector
const WEBP_LOSSLESS_DATA_URI =
  'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';

export function detectWebpSupport(): Promise<boolean> {
  const map = window.__WEBP_ASSET_MAP__;
  if (!map || Object.keys(map).length === 0) {
    webpSupported = false;
    return Promise.resolve(false);
  }
  if (detectionPromise) {
    return detectionPromise;
  }
  detectionPromise = new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      webpSupported = ok;
      resolve(ok);
    };
    const timer = window.setTimeout(() => finish(false), 150);
    const img = new Image();
    img.onload = () => {
      window.clearTimeout(timer);
      finish(img.width === 1 && img.height === 1);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      finish(false);
    };
    img.src = WEBP_LOSSLESS_DATA_URI;
  });
  return detectionPromise;
}

export function resolveAssetUrl(assetPath: string): string {
  if (!webpSupported) return assetPath;
  const map = window.__WEBP_ASSET_MAP__;
  if (!map) return assetPath;

  const hasDotSlash = assetPath.startsWith('./');
  const normalized = hasDotSlash ? assetPath.slice(2) : assetPath;
  const mapped = map[normalized];
  if (!mapped) return assetPath;

  return hasDotSlash ? `./${mapped}` : mapped;
}
