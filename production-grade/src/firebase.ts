import { initializeApp } from "firebase/app";

// Replace these placeholders with actual values from the Firebase console when available
// Project Name: Autopay-Protocol
// Project ID: autopay-protocol
// Project Number: 803546112610
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "autopay-protocol.firebaseapp.com",
  projectId: "autopay-protocol",
  storageBucket: "autopay-protocol.firebasestorage.app",
  messagingSenderId: "803546112610",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

export default app;
