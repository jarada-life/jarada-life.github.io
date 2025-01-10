self.onmessage = function(e) {
    const data = e.data;
    console.debug('Worker received message:', data);
    self.postMessage(data);
    console.debug('Worker posted message:', data);
};

self.onerror = function(e) {
    console.error('Worker error:', e);
};

self.onmessageerror = function(e) {
    console.error('Worker message error:', e);
};
