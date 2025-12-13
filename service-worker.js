// 必須ではないが、PWA 有効化のための空 SW
self.addEventListener("install", () => {
  self.skipWaiting();
});
