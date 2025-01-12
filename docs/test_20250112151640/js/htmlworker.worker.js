self.onmessage = function(e) {
    console.log('Worker: Message received from main script');
    const html = e.data;
    
    
    console.log('Worker: Sending processed HTML back to main script');
    self.postMessage(html);
};


self.onerror = function(e) {
    console.error('Worker error:', e.message);
};

self.onmessageerror = function(e) {
    console.error('Worker message error:', e);
};