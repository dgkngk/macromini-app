import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyACyxyJVQaTPKkQeFgGYd1dSESCbkyhMKY",
  authDomain: "macromini-test.firebaseapp.com",
  projectId: "macromini-test",
  storageBucket: "macromini-test.firebasestorage.app",
  messagingSenderId: "244848408760",
  appId: "1:244848408760:web:4b94b135dac2308a875c4d",
  measurementId: "G-QXJRRZYKMB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
