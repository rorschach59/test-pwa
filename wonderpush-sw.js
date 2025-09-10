// WonderPush SW (hosted on same origin)
// https://docs.wonderpush.com/docs/web-push-getting-started
try {
  importScripts('https://cdn.by.wonderpush.com/sdk/1.1/wonderpush-service-worker-loader.min.js');
} catch (e) {
  // Silencieux: l'erreur sera visible dans la console SW
}


