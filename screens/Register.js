import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
  const [cargando, setCargando] = useState(false);

  const handleRegister = async () => {
    if (cargando) return;

    setError("");
    setMensaje("");

    const nombreLimpio = nombre.trim();
    const correo = email.trim();

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

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setCargando(true);

      console.log("1. Creando usuario en Authentication...");

      const credenciales = await createUserWithEmailAndPassword(
        auth,
        correo,
        password
      );

      const usuario = credenciales.user;

      console.log("2. Usuario creado:", usuario.uid);
      console.log("3. Guardando usuario en Firestore...");

      await setDoc(doc(db, "usuarios", usuario.uid), {
        uid: usuario.uid,
        nombre: nombreLimpio,
        email: usuario.email,
        rol: "usuario",
        fechaRegistro: serverTimestamp(),
      });

      console.log("4. Usuario guardado correctamente en Firestore");

      setMensaje("¡Cuenta creada correctamente!");

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
      } else if (
        err.code === "permission-denied" ||
        err.code === "firestore/permission-denied"
      ) {
        setError(
          "El usuario pudo crearse, pero no se pudo guardar su información en Firestore. Revisa las reglas de seguridad."
        );
      } else {
        setError("No se pudo crear la cuenta. Inténtalo nuevamente.");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <ImageBackground
      source={{
        uri: "https://i.pinimg.com/1200x/a2/0d/6b/a20d6be9b14a1f3186c6e8a3f9ad1120.jpg",
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.container}>
              <Text style={styles.titulo}>Crear cuenta</Text>

              <Text style={styles.subtitulo}>
                Regístrate para comenzar
              </Text>

              <Text style={styles.label}>Nombre</Text>

              <TextInput
                style={styles.input}
                placeholder="Ingresa tu nombre"
                placeholderTextColor="#8E8E93"
                value={nombre}
                onChangeText={setNombre}
                autoCapitalize="words"
                autoCorrect={false}
              />

              <Text style={styles.label}>Correo electrónico</Text>

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

              <Text style={styles.label}>Contraseña</Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor="#8E8E93"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!mostrarPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
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

              <Text style={styles.label}>Confirmar contraseña</Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirma tu contraseña"
                  placeholderTextColor="#8E8E93"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!mostrarConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
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

              {error !== "" && (
                <Text style={styles.error}>{error}</Text>
              )}

              {mensaje !== "" && (
                <Text style={styles.mensaje}>{mensaje}</Text>
              )}

              <TouchableOpacity
                style={[
                  styles.boton,
                  cargando && styles.botonDeshabilitado,
                ]}
                onPress={handleRegister}
                activeOpacity={0.8}
                disabled={cargando}
              >
                <Text style={styles.textoBoton}>
                  {cargando ? "Creando cuenta..." : "Crear cuenta"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },

  keyboard: {
    flex: 1,
  },

  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 25,
  },

  container: {
    marginHorizontal: 20,
    padding: 25,
    borderRadius: 20,
    backgroundColor: "rgba(248, 250, 250, 0.96)",
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
    marginBottom: 30,
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
    color: "#1D3D47",
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
    color: "#1D3D47",
  },

  botonMostrar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
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

  botonDeshabilitado: {
    opacity: 0.6,
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
