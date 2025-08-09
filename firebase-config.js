// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCtfaGL0LU9sxkAlBij45R6Ef1tbjCyrHo",
  authDomain: "powerplantwarehouse.firebaseapp.com",
  projectId: "powerplantwarehouse",
  storageBucket: "powerplantwarehouse.firebasestorage.app",
  messagingSenderId: "345891498716",
  appId: "1:345891498716:web:a62b8129cbee4798e32219"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Export for use in other files
window.firebaseApp = app;
window.firestoreDB = db;
window.firebaseAuth = auth;