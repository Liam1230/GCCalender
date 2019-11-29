
import Vue from 'vue'
import * as firebase from "firebase/app";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCV1G0_nC9rDLHKYGK8xsTgeDxVF-WdsIU",
    authDomain: "garagecampus-dd3ca.firebaseapp.com",
    databaseURL: "https://garagecampus-dd3ca.firebaseio.com",
    projectId: "garagecampus-dd3ca",
    storageBucket: "garagecampus-dd3ca.appspot.com",
    messagingSenderId: "305430837895",
    appId: "1:305430837895:web:165d49530a52ae9b711622"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export default function(app,inject){
    inject('firebase',firebase)
}
