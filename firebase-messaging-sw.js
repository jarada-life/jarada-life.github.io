importScripts('https://www.gstatic.com/firebasejs/10.3.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.3.0/firebase-messaging-compat.js');
importScripts('./config/firebase-config-sw.js');

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("Background message received: ", payload);
    console.log("Sender:", payload.from);
    console.log("Priority:", payload.priority);
    const { title, body } = payload.notification;
    self.registration.showNotification(title, { 
        body,
        timestamp: Date.now() // 알림 시간 기록
    });
});