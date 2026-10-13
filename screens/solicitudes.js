import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { auth, db } from "../firebaseConfig.js";

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setCargando(true);

      const consulta = query(
        collection(db, "solicitudes"),
        where("estado", "==", "Pendiente"),
        orderBy("fecha", "desc")
      );

      const resultado = await getDocs(consulta);

      const datos = resultado.docs.map((documento) => ({
        id: documento.id,
        ...documento.data(),
      }));

      setSolicitudes(datos);

    } catch (error) {
      console.log("Error al cargar solicitudes:", error);

      Alert.alert(
        "Error",
        "No fue posible cargar las solicitudes."
      );
    } finally {
      setCargando(false);
    }
  };

  const ofrecerAyuda = (solicitud) => {
    const usuarioActual = auth.currentUser;

    if (!usuarioActual) {
      Alert.alert(
        "Inicia sesión",
        "Debes iniciar sesión para ofrecer ayuda."
      );
      return;
    }

    Alert.alert(
      "Ofrecer ayuda",
      `¿Quieres ofrecer tu ayuda para esta solicitud de ${solicitud.tipoAyuda}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sí, ayudar",
          onPress: () => {
            Alert.alert(
              "¡Gracias!",
              "Tu intención de ayudar ha sido registrada."
            );
          },
        },
      ]
    );
  };

  const obtenerIcono = (tipo) => {
    switch (tipo) {
      case "Médicos":
        return "medkit-outline";

      case "Primeros auxilios":
        return "medical-outline";

      case "Voluntarios":
        return "people-outline";

      case "Rescate":
        return "shield-checkmark-outline";

      case "Alimentos":
        return "restaurant-outline";

      case "Agua y suministros":
        return "water-outline";

      case "Refugio":
        return "home-outline";

      default:
        return "help-circle-outline";
    }
  };

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#D97706"
        />

        <Text style={styles.loadingText}>
          Cargando solicitudes...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* Encabezado */}
      <View style={styles.header}>

        <View style={styles.headerIcon}>
          <Ionicons
            name="alert-circle-outline"
            size={32}
            color="#FFFFFF"
          />
        </View>

        <Text style={styles.title}>
          Solicitudes de ayuda
        </Text>

        <Text style={styles.subtitle}>
          Aquí puedes encontrar personas que necesitan
          apoyo después de una emergencia.
        </Text>

      </View>

      {/* Sin solicitudes */}
      {solicitudes.length === 0 ? (

        <View style={styles.emptyContainer}>

          <Ionicons
            name="checkmark-circle-outline"
            size={70}
            color="#D97706"
          />

          <Text style={styles.emptyTitle}>
            No hay solicitudes pendientes
          </Text>

          <Text style={styles.emptyText}>
            En este momento no hay solicitudes de ayuda
            disponibles.
          </Text>

        </View>

      ) : (

        solicitudes.map((solicitud) => (

          <View
            key={solicitud.id}
            style={styles.card}
          >

            {/* Tipo de ayuda */}
            <View style={styles.cardHeader}>

              <View style={styles.typeIcon}>

                <Ionicons
                  name={obtenerIcono(solicitud.tipoAyuda)}
                  size={25}
                  color="#D97706"
                />

              </View>

              <View style={styles.typeContainer}>

                <Text style={styles.typeTitle}>
                  {solicitud.tipoAyuda}
                </Text>

                <View style={styles.statusContainer}>

                  <View style={styles.statusDot} />

                  <Text style={styles.statusText}>
                    Pendiente
                  </Text>

                </View>

              </View>

            </View>

            {/* Descripción */}
            <Text style={styles.descriptionTitle}>
              Descripción
            </Text>

            <Text style={styles.description}>
              {solicitud.descripcion}
            </Text>

            {/* Botón */}
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => ofrecerAyuda(solicitud)}
            >

              <Ionicons
                name="hand-left-outline"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.helpButtonText}>
                Ofrecer ayuda
              </Text>

            </TouchableOpacity>

          </View>

        ))

      )}

      {/* Actualizar */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={cargarSolicitudes}
      >

        <Ionicons
          name="refresh-outline"
          size={20}
          color="#D97706"
        />

        <Text style={styles.refreshText}>
          Actualizar solicitudes
        </Text>

      </TouchableOpacity>

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

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F6F8",
  },

  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 15,
  },

  header: {
    alignItems: "center",
    marginBottom: 25,
  },

  headerIcon: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "#D97706",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#222",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  typeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
  },

  typeContainer: {
    marginLeft: 12,
  },

  typeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D97706",
    marginRight: 6,
  },

  statusText: {
    fontSize: 13,
    color: "#777",
  },

  descriptionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 5,
  },

  description: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    marginBottom: 18,
  },

  helpButton: {
    height: 48,
    backgroundColor: "#D97706",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  helpButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 35,
    alignItems: "center",
    marginTop: 10,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#333",
    marginTop: 15,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },

  refreshButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D97706",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 5,
  },

  refreshText: {
    color: "#D97706",
    fontSize: 15,
    fontWeight: "bold",
  },
});