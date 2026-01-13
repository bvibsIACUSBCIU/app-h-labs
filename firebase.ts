import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDR9pynklt-2bp3NsrTcb0CZW4DHvioHb4",
    authDomain: "x-test-connact.firebaseapp.com",
    projectId: "x-test-connact",
    storageBucket: "x-test-connact.firebasestorage.app",
    messagingSenderId: "88079795446",
    appId: "1:88079795446:web:253d95d9e72d8064d558d7",
    measurementId: "G-74JEQB5QSV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
