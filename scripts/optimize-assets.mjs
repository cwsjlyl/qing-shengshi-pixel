import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const distDir = join(process.cwd(), 'dist');
const assetsDir = join(distDir, 'assets');

function hasBinary(cmd, args = ['-version']) {
  try {
    execFileSync(cmd, args, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function ensureCiOptimizers() {
  if (hasBinary('cwebp', ['-version'])) return;
  if (process.env.GITHUB_ACTIONS === 'true' && process.platform === 'linux') {
    try {
      console.log('[optimize-assets] Installing lossless WebP/PNG tools in GitHub Actions runner...');
      execFileSync('sudo', ['-n', 'apt-get', 'update', '-qq'], { stdio: 'ignore' });
      execFileSync(
        'sudo',
        ['-n', 'apt-get', 'install', '-y', '-qq', '--no-install-recommends', 'webp', 'optipng'],
        { stdio: 'ignore' }
      );
    } catch {
      // Fall back to preinstalled ImageMagick or original PNGs if apt is unavailable
    }
  }
}

function convertPngToLosslessWebp(pngPath, webpPath, canCwebp, canMagick, canConvert) {
  if (canCwebp) {
    execFileSync('cwebp', ['-lossless', '-z', '9', '-m', '6', '-quiet', pngPath, '-o', webpPath]);
    return true;
  }
  if (canMagick) {
    execFileSync('magick', [pngPath, '-define', 'webp:lossless=true', '-quality', '100', webpPath]);
    return true;
  }
  if (canConvert) {
    execFileSync('convert', [pngPath, '-define', 'webp:lossless=true', '-quality', '100', webpPath]);
    return true;
  }
  return false;
}

function walkFiles(dir) {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results;
}

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function main() {
  if (!existsSync(distDir)) {
    console.warn('[optimize-assets] dist/ does not exist, skipping.');
    return;
  }

  ensureCiOptimizers();

  const allAssetFiles = walkFiles(assetsDir);
  const pngFiles = allAssetFiles.filter((f) => extname(f).toLowerCase() === '.png');

  const canOptipng = hasBinary('optipng', ['-v']);
  const canCwebp = hasBinary('cwebp', ['-version']);
  const canMagick = !canCwebp && hasBinary('magick', ['-version']);
  const canConvert = !canCwebp && !canMagick && hasBinary('convert', ['-version']);

  const webpMap = {};
  let totalOrigBytes = 0;
  let totalServedBytes = 0;

  for (const pngPath of pngFiles) {
    const origSize = statSync(pngPath).size;
    totalOrigBytes += origSize;

    if (canOptipng) {
      try {
        execFileSync('optipng', ['-o2', '-strip', 'all', '-quiet', pngPath]);
      } catch {
        // Keep original PNG if optipng skips
      }
    }

    const optimizedPngSize = statSync(pngPath).size;
    const relPng = relative(distDir, pngPath).split(sep).join('/');

    if (canCwebp || canMagick || canConvert) {
      const webpPath = pngPath.replace(/\.png$/i, '.webp');
      const relWebp = relPng.replace(/\.png$/i, '.webp');
      try {
        // Lossless WebP preserves 100% exact RGB pixel values for OriginalArtLoader chroma/grid algorithms
        convertPngToLosslessWebp(pngPath, webpPath, canCwebp, canMagick, canConvert);
        if (existsSync(webpPath)) {
          const webpSize = statSync(webpPath).size;
          if (webpSize > 0 && webpSize < optimizedPngSize) {
            webpMap[relPng] = relWebp;
            totalServedBytes += webpSize;
            const pct = (((origSize - webpSize) / origSize) * 100).toFixed(1);
            console.log(`[optimize-assets] ${relPng}: ${formatKB(origSize)} -> ${formatKB(webpSize)} WebP (-${pct}%)`);
            continue;
          }
          unlinkSync(webpPath);
        }
      } catch {
        if (existsSync(webpPath)) {
          try {
            unlinkSync(webpPath);
          } catch {
            // Ignore cleanup failure
          }
        }
      }
    }

    totalServedBytes += optimizedPngSize;
    if (optimizedPngSize < origSize) {
      console.log(`[optimize-assets] ${relPng}: ${formatKB(origSize)} -> ${formatKB(optimizedPngSize)} PNG`);
    }
  }

  if (Object.keys(webpMap).length === 0) {
    console.log('[optimize-assets] No WebP encoder available locally; serving PNG fallback assets.');
  } else if (totalOrigBytes > 0) {
    const savedPct = (((totalOrigBytes - totalServedBytes) / totalOrigBytes) * 100).toFixed(1);
    console.log(
      `[optimize-assets] Classroom payload per iPad: ${formatKB(totalOrigBytes)} -> ${formatKB(totalServedBytes)} (-${savedPct}%)`
    );
  }

  // Generate Service Worker precache manifest for core shell (JS/CSS/SVG)
  const finalAssetFiles = walkFiles(assetsDir);
  const shellPrecache = finalAssetFiles
    .filter((f) => /\.(?:js|css|svg)$/i.test(f))
    .map((f) => `./${relative(distDir, f).split(sep).join('/')}`)
    .sort();

  const hashSource = finalAssetFiles
    .map((f) => `${relative(distDir, f)}:${statSync(f).size}`)
    .sort()
    .join('|');
  const buildHash = createHash('sha256').update(hashSource).digest('hex').slice(0, 8);

  writeFileSync(
    join(distDir, 'sw-precache.json'),
    JSON.stringify({ version: buildHash, precache: shellPrecache }, null, 2),
    'utf8'
  );

  // Stamp cache version into dist/sw.js
  const swPath = join(distDir, 'sw.js');
  if (existsSync(swPath)) {
    const swRaw = readFileSync(swPath, 'utf8');
    writeFileSync(swPath, swRaw.replace(/__BUILD_CACHE_ID__/g, buildHash), 'utf8');
  }

  // Inject production classroom flags & WebP asset map into dist/index.html
  const indexHtmlPath = join(distDir, 'index.html');
  if (existsSync(indexHtmlPath)) {
    const html = readFileSync(indexHtmlPath, 'utf8');
    const inlineScript = `<script>window.__CLASSROOM_PROD__=true;window.__WEBP_ASSET_MAP__=${JSON.stringify(webpMap)};</script>`;
    if (html.includes('</head>')) {
      writeFileSync(indexHtmlPath, html.replace('</head>', `  ${inlineScript}\n  </head>`), 'utf8');
    }
  }
}

main();
