// Service Worker 설치
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// 네트워크 요청 처리
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // 오프라인일 때 기본 응답
      return new Response("Offline", {
        status: 503,
        statusText: "Service Unavailable",
        headers: new Headers({
          "Content-Type": "text/plain",
        }),
      });
    })
  );
});
