self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open('amor-v3').then(c=>c.addAll(['/','/index.html','/manifest.json','/icons/icon-192.png','/icons/icon-512.png'])));
});
self.addEventListener('fetch', (e)=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});
self.addEventListener('push', function(event) {
  let data = {};
  try { data = event.data.json(); } catch(e){ data = { title:'Mensagem 💌', body: event.data && event.data.text() }; }
  const title = data.title || 'Mensagem 💌';
  const options = { body: data.body || 'Carinho enviado!', icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' };
  event.waitUntil(self.registration.showNotification(title, options));
});
