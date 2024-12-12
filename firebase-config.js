const config = {
  apiKey: "AIzaSyAIbzvJunRGn9J2_MtHOlSDkp3Y2fLyZtc",
  authDomain: "woory-common.firebaseapp.com",
  projectId: "woory-common",
  storageBucket: "woory-common.firebasestorage.app",
  messagingSenderId: "594982737859",
  appId: "1:594982737859:web:0f1ab35c0e29cb1d8e0f76",
  measurementId: "G-0G8ZJD2YBY"
};
// Service Worker 환경인지 확인
if ('serviceWorker' in navigator) {
    // ESM 모듈로 export
    export const firebaseConfig = config;
} else {
    // Service Worker에서 사용할 전역 변수로 설정
    self.firebaseConfig = config;
}