import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCHYtwjStoaB2RnGivPTlXH7bBwJUvSHOs",
  authDomain: "dland-1ad12.firebaseapp.com",
  projectId: "dland-1ad12",
  storageBucket: "dland-1ad12.firebasestorage.app",
  messagingSenderId: "410110431982",
  appId: "1:410110431982:web:abf76af87cbf83cb2819ff"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };
