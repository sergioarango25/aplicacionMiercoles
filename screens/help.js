import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { auth, db } from "../firebaseConfig.js";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function Help() {
  const [tipoAyuda, setTipoAyuda] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);

  const tiposAyuda = [
    {
      nombre: "Médicos",
      icono: "medkit-outline",
    },
    {
      nombre: "Primeros auxilios",
      icono: "medical-outline",
    },
    {
      nombre: "Voluntarios",
      icono: "people-outline",
    },
    {
      nombre: "Rescate",
      icono: "shield-checkmark-outline",
    },
    {
      nombre: "Alimentos",
      icono: "restaurant-outline",
    },
    {
      nombre: "Agua y suministros",
      icono: "water-outline",
    },
    {
      nombre: "Refugio",
      icono: "home-outline",
    },
    {
      nombre: "Otro",
      icono: "help-circle-outline",
    },
  ];

  const enviarSolicitud = async () => {
    if (!tipoAyuda) {
      Alert.alert(
        "Falta información",
        "Selecciona el tipo de ayuda que necesitas."

      );
      return;
    }

    if (!descripcion.trim()) {
      Alert.alert(
        "Falta información",
        "Describe qué tipo de ayuda necesitas."
      );
      return;
    }

    const usuarioActual = auth.currentUser;

    if (!usuarioActual) {
      Alert.alert(
        "No has iniciado sesión",
        "Debes iniciar sesión para enviar una solicitud."
      );
      return;
    }

    try {
      setGuardando(true);

      await addDoc(collection(db, "solicitudes"), {
        usuarioId: usuarioActual.uid,
        tipoAyuda: tipoAyuda,
        descripcion: descripcion.trim(),
        estado: "Pendiente",
        fecha: serverTimestamp(),
      });

      Alert.alert(
        "Solicitud enviada",
        "Tu solicitud de ayuda fue registrada correctamente."
      );

      setTipoAyuda("");
      setDescripcion("");

    } catch (error) {
      console.log("Error al guardar solicitud:", error);

      Alert.alert(
        "Error",
        "No fue posible guardar la solicitud. Intenta nuevamente."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Encabezado */}
      <View style={styles.header}>

        <View style={styles.iconHeader}>
          <Ionicons
            name="alert-circle-outline"
            size={50}
            color="#0f172a"
          />
        </View>

        <Text style={styles.title}>
          Solicitar ayuda
        </Text>
      </View>

      {/* Información */}
      <View style={styles.infoBox}>

        <Ionicons
          name="information-circle-outline"
          size={24}
          color="#0f172a"
        />

        <Text style={styles.infoText}>
          Selecciona el tipo de ayuda que necesitas y
          explica brevemente la situación.
        </Text>

      </View>

      {/* Tipo de ayuda */}
      <Text style={styles.sectionTitle}>
        ¿Qué tipo de ayuda necesitas?
      </Text>

      <View style={styles.optionsContainer}>

        {tiposAyuda.map((tipo) => (

          <TouchableOpacity
            key={tipo.nombre}
            style={[
              styles.option,
              tipoAyuda === tipo.nombre &&
                styles.optionSelected,
            ]}
            onPress={() => setTipoAyuda(tipo.nombre)}
          >

            <Ionicons
              name={tipo.icono}
              size={25}
              color={
                tipoAyuda === tipo.nombre
                  ? "#FFFFFF"
                  : "#1d4ed8"
              }
            />

            <Text
              style={[
                styles.optionText,
                tipoAyuda === tipo.nombre &&
                  styles.optionTextSelected,
              ]}
            >
              {tipo.nombre}
            </Text>

          </TouchableOpacity>

        ))}

      </View>

      {/* Descripción */}
      <Text style={styles.sectionTitle}>
        Describe lo que necesitas
      </Text>

      <TextInput
        style={styles.textArea}
        placeholder="Ejemplo: Necesitamos médicos para atender a varias personas en la zona..."
        placeholderTextColor="#999"
        multiline
        numberOfLines={6}
        maxLength={500}
        value={descripcion}
        onChangeText={setDescripcion}
        textAlignVertical="top"
      />

      <Text style={styles.counter}>
        {descripcion.length}/500 caracteres
      </Text>

      {/* Botón */}
      <TouchableOpacity
        style={[
          styles.button,
          guardando && styles.buttonDisabled,
        ]}
        onPress={enviarSolicitud}
        disabled={guardando}
      >

        <Ionicons
          name="send-outline"
          size={25}
          color="#FFFFFF"
        />

        <Text style={styles.buttonText}>
          {guardando
            ? "Enviando..."
            : "Enviar solicitud"}
        </Text>

      </TouchableOpacity>

      {/* Nota */}
      <View style={styles.warningBox}>

        <Ionicons
          name="warning-outline"
          size={35}
          color="#0f172a"
        />

        <Text style={styles.warningText}>
          En una emergencia que represente un peligro
          inmediato para la vida, comunícate también con
          los servicios de emergencia de tu localidad.
        </Text>

      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6F8",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    alignItems: "center",
    marginBottom: 20,
  },

  iconHeader: {
    width: 65,
    height: 65,
    borderRadius: 50,
    BackgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#222",
    textAlign: "center",
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    padding: 14,
    marginBottom: 25,
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    marginLeft: 10,
    lineHeight: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 12,
  },

  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  option: {
    width: "48%",
    minHeight: 90,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  optionSelected: {
    backgroundColor: "#1d4ed8",
    borderColor: "#1d4ed8",
  },

  optionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 7,
    textAlign: "center",
  },

  optionTextSelected: {
    color: "#FFFFFF",
  },

  textArea: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 14,
    minHeight: 140,
    padding: 15,
    fontSize: 15,
    color: "#333",
    marginBottom: 5,
  },

  counter: {
    textAlign: "right",
    color: "#888",
    fontSize: 12,
    marginBottom: 20,
  },

  button: {
    height: 52,
    backgroundColor: "#0f172a",
    borderRadius: 13,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  warningBox: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 14,
    alignItems: "flex-start",
  },

  warningText: {
    flex: 1,
    color: "#92400E",
    fontSize: 13,
    lineHeight: 19,
    marginLeft: 9,
  },
});