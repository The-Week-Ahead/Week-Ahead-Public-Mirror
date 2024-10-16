let WORKER_VERSION = "1.1.5";

let CURRENT_VERSION = "default";
function fetchVersion() {
  return fetch("/week-ahead/version")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => data.version)
    .catch((error) => {
      console.warn("Version fetch failed, using existing cache:", error);
      return CURRENT_VERSION;
    });
}

function getCacheNames(version) {
  return {
    STATIC_CACHE: `static-cache-v${version}`,
    DYNAMIC_CACHE: `dynamic-cache-v${version}`,
  };
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    fetchVersion().then((version) => {
      CURRENT_VERSION = version;
      const cacheNames = getCacheNames(version);
      return caches.open(cacheNames.STATIC_CACHE).then((cache) => {
        return cache.addAll([
          "/week-ahead",
          `/week-ahead/static/js/script.min.js?v=${CURRENT_VERSION}`,
          `/week-ahead/static/css/styles.css?v=${CURRENT_VERSION}`,
          "https://cdn.jsdelivr.net/gh/philfung/add-to-homescreen@1.9/dist/add-to-homescreen.min.css",
          "https://cdn.jsdelivr.net/gh/philfung/add-to-homescreen@1.9/dist/add-to-homescreen.min.js",
        ]);
      });
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    fetchVersion().then((version) => {
      CURRENT_VERSION = version;
      const cacheNames = getCacheNames(version);
      return caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (
              ![cacheNames.STATIC_CACHE, cacheNames.DYNAMIC_CACHE].includes(key)
            ) {
              console.log("[Service Worker] Deleting old cache:", key);
              return caches.delete(key);
            }
          }),
        );
      });
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  if (
    event.request.mode === "navigate" ||
    requestUrl.pathname === "/week-ahead"
  ) {
    event.respondWith(
      caches.match("/week-ahead").then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(event.request)
            .then((networkResponse) => {
              return caches
                .open(`static-cache-v${CURRENT_VERSION}`)
                .then((cache) => {
                  cache.put("/week-ahead", networkResponse.clone());
                  return networkResponse;
                });
            })
            .catch(() => {
              return new Response(
                "You are currently unable to access the week ahead website due to lack of internet.",
                {
                  status: 408,
                  headers: { "Content-Type": "text/plain" },
                },
              );
            })
        );
      }),
    );
    return;
  }

  const isStatic = [
    "/week-ahead/static/js/script.min.js",
    "/week-ahead/static/css/styles.css",
  ].includes(requestUrl.pathname);

  if (isStatic) {
    event.respondWith(
      caches
        .match(event.request)
        .then((response) => {
          return (
            response ||
            fetch(event.request).then((networkResponse) => {
              return caches
                .open(`static-cache-v${CURRENT_VERSION}`)
                .then((cache) => {
                  cache.put(event.request, networkResponse.clone());
                  return networkResponse;
                });
            })
          );
        })
        .catch(() => {
          return caches
            .match("/week-ahead/static/offline.html")
            .then((response) => {
              return (
                response ||
                new Response("Offline", {
                  status: 408,
                  headers: { "Content-Type": "text/plain" },
                })
              );
            });
        }),
    );
  } else {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches
            .open(`dynamic-cache-v${CURRENT_VERSION}`)
            .then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
        })
        .catch(() => {
          return caches.match(event.request).then((response) => {
            return (
              response ||
              new Response("Network error happened", {
                status: 408,
                headers: { "Content-Type": "text/plain" },
              })
            );
          });
        }),
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "UPDATE_TIMETABLE_CACHE") {
    updateTimetableCache();
  }
});

function updateTimetableCache() {
  fetch("/week-ahead/static/data/timetable.json", { cache: "no-cache" })
    .then((response) => {
      if (response.ok) {
        return caches
          .open(`dynamic-cache-v${CURRENT_VERSION}`)
          .then((cache) => {
            cache.put(
              "/week-ahead/static/data/timetable.json",
              response.clone(),
            );
            console.log("timetable.json cache updated successfully.");

            return self.clients.matchAll();
          });
      } else {
        throw new Error(`Failed to fetch timetable.json: ${response.status}`);
      }
    })
    .then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: "TIMETABLE_UPDATED" });
      });
    })
    .catch((error) => {
      console.error("Error updating timetable.json cache:", error);
    });
}
