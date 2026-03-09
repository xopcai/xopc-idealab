#!/usr/bin/env bun
/**
 * 生成 PWA 图标
 */

// 创建简单的 PNG 占位符（实际应该用真实图标）
const svg192 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" fill="#00ff88" rx="40"/>
  <text x="96" y="130" text-anchor="middle" font-size="100" fill="#000" font-weight="bold">⚡</text>
</svg>`;

const svg512 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#00ff88" rx="100"/>
  <text x="256" y="340" text-anchor="middle" font-size="280" fill="#000" font-weight="bold">⚡</text>
</svg>`;

await Bun.write('public/pwa-192x192.png', svg192);
await Bun.write('public/pwa-512x512.png', svg512);

console.log('✅ 图标生成完成（SVG 格式）');
