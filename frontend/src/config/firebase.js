// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseApp = initializeApp({

    apiKey: "AIzaSyDf4XaY5tRthfcIy5ssjcAKlCYgB7ZkMjU",

    authDomain: "goplace-f33c9.firebaseapp.com",

    databaseURL: "https://goplace-f33c9-default-rtdb.europe-west1.firebasedatabase.app",

    projectId: "goplace-f33c9",

    storageBucket: "goplace-f33c9.firebasestorage.app",

    messagingSenderId: "978391795944",

    appId: "1:978391795944:web:342789484e502bfb19a15d"
});

const realtime = getDatabase(firebaseApp);

export default realtime;