import { initializeApp } from "firebase/app";

import {
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";

import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBu0cF-sGkVwgK6gixsoSsPfQRxc8aui6M",
  authDomain: "esperanza-4fa75.firebaseapp.com",
  projectId: "esperanza-4fa75",
  storageBucket: "esperanza-4fa75.firebasestorage.app",
  messagingSenderId: "1069505478496",
  appId: "1:1069505478496:web:8186cd4dc9f0b373926805",
  measurementId: "G-M3L7YVWJQK"
};

export const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);