// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.3.0/firebase-messaging.js');

// Firebase 초기화
const firebaseConfig = {
    apiKey: "AIzaSyAIbzvJunRGn9J2_MtHOlSDkp3Y2fLyZtc",
    authDomain: "woory-common.firebaseapp.com",
    projectId: "woory-common",
    storageBucket: "woory-common.appspot.com",
    messagingSenderId: "594982737859",
    appId: "1:594982737859:web:0f1ab35c0e29cb1d8e0f76"
};
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
    console.log("Background message received: ", payload);
    const { title, body } = payload.notification;
    self.registration.showNotification(title, { body });
});
