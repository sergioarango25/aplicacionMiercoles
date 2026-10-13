import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "../firebaseConfig.js";

export default function InicioRegistro() {

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmPassword, setMostrarConfirmPassword] = useState(false);

  const handleRegister = async () => {

    setError("");
    setMensaje("");

    const nombreLimpio = nombre.trim();
    const correo = email.trim();

    // Validar campos vacíos
    if (
      nombreLimpio === "" ||
      correo === "" ||
      password === "" ||
      confirmPassword === ""
    ) {
      setError("Por favor completa todos los campos.");
      return;
    }

    // Validar correo
    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correoValido.test(correo)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    // Validar contraseña
    if (password.length < 6) {
      setError("La contraseña debe tener mínimo 6 caracteres.");
      return;
    }

    if (password.length > 50) {
      setError("La contraseña no puede tener más de 50 caracteres.");
      return;
    }

    if (!/[A-Za-z]/.test(password)) {
      setError("La contraseña debe tener al menos una letra.");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError("La contraseña debe tener al menos un número.");
      return;
    }

    // Confirmar contraseña
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {

      console.log("1. Creando usuario en Authentication...");

      // Crear usuario en Firebase Authentication
      const credenciales = await createUserWithEmailAndPassword(
        auth,
        correo,
        password
      );

      const usuario = credenciales.user;

      console.log("2. Usuario creado:", usuario.uid);

      console.log("3. Guardando usuario en Firestore...");

      // Guardar información adicional en Firestore
      await setDoc(doc(db, "usuarios", usuario.uid), {
        uid: usuario.uid,
        nombre: nombreLimpio,
        email: usuario.email,
        rol: "usuario",
        fechaRegistro: serverTimestamp(),
      });

      console.log("4. Usuario guardado correctamente en Firestore");

      setMensaje("¡Cuenta creada correctamente!");

      // Limpiar campos
      setNombre("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

    } catch (err) {

      console.log("ERROR:", err);
      console.log("ERROR CODE:", err.code);
      console.log("ERROR MESSAGE:", err.message);

      if (err.code === "auth/email-already-in-use") {

        setError("Este correo ya está registrado.");

      } else if (err.code === "auth/invalid-email") {

        setError("El correo electrónico no es válido.");

      } else if (err.code === "auth/weak-password") {

        setError("La contraseña es demasiado débil.");

      } else if (err.code === "auth/network-request-failed") {

        setError("No hay conexión a internet.");

      } else if (err.code === "permission-denied") {

        setError(
          "El usuario se creó, pero no se pudo guardar en Firestore."
        );

      } else {

        setError("No se pudo crear la cuenta.");

      }
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.titulo}>
        Crear cuenta
      </Text>

      <Text style={styles.subtitulo}>
        Regístrate para comenzar
      </Text>

      {/* NOMBRE */}

      <Text style={styles.label}>
        Nombre
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ingresa tu nombre"
        placeholderTextColor="#8E8E93"
        value={nombre}
        onChangeText={setNombre}
        autoCapitalize="words"
      />

      {/* CORREO */}

      <Text style={styles.label}>
        Correo electrónico
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ingresa tu correo"
        placeholderTextColor="#8E8E93"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* CONTRASEÑA */}

      <Text style={styles.label}>
        Contraseña
      </Text>

      <View style={styles.passwordContainer}>

        <TextInput
          style={styles.passwordInput}
          placeholder="Ingresa tu contraseña"
          placeholderTextColor="#8E8E93"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!mostrarPassword}
        />

        <TouchableOpacity
          onPress={() => setMostrarPassword(!mostrarPassword)}
          style={styles.botonMostrar}
        >
          <Text style={styles.mostrarTexto}>
            {mostrarPassword ? "Ocultar" : "Ver"}
          </Text>
        </TouchableOpacity>

      </View>

      {/* CONFIRMAR CONTRASEÑA */}

      <Text style={styles.label}>
        Confirmar contraseña
      </Text>

      <View style={styles.passwordContainer}>

        <TextInput
          style={styles.passwordInput}
          placeholder="Confirma tu contraseña"
          placeholderTextColor="#8E8E93"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!mostrarConfirmPassword}
        />

        <TouchableOpacity
          onPress={() =>
            setMostrarConfirmPassword(!mostrarConfirmPassword)
          }
          style={styles.botonMostrar}
        >
          <Text style={styles.mostrarTexto}>
            {mostrarConfirmPassword ? "Ocultar" : "Ver"}
          </Text>
        </TouchableOpacity>

      </View>

      {/* MENSAJE DE ERROR */}

      {error !== "" && (
        <Text style={styles.error}>
          {error}
        </Text>
      )}

      {/* MENSAJE DE ÉXITO */}

      {mensaje !== "" && (
        <Text style={styles.mensaje}>
          {mensaje}
        </Text>
      )}

      {/* BOTÓN */}

      <TouchableOpacity
        style={styles.boton}
        onPress={handleRegister}
        activeOpacity={0.8}
      >
        <Text style={styles.textoBoton}>
          Crear cuenta
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 25,
    justifyContent: "center",
    backgroundColor: "#F8FAFA",
  },

  titulo: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#1D3D47",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitulo: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 35,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1D3D47",
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
  },

  passwordContainer: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
  },

  passwordInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 15,
    fontSize: 16,
  },

  botonMostrar: {
    paddingHorizontal: 12,
  },

  mostrarTexto: {
    color: "#1D3D47",
    fontWeight: "bold",
    fontSize: 14,
  },

  boton: {
    height: 52,
    backgroundColor: "#1D3D47",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  textoBoton: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },

  error: {
    color: "#D32F2F",
    fontSize: 14,
    marginBottom: 10,
  },

  mensaje: {
    color: "#2E7D32",
    fontSize: 14,
    marginBottom: 10,
    fontWeight: "600",
  },

});