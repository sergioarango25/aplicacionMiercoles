import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { auth, db } from "../firebaseConfig.js";

import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
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
          color="#A8803A"
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
            color="#A8803A"
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
                  color="#A8803A"
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
          color="#A8803A"
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
    backgroundColor: "#F6F4EF",
  },

  content: {
    padding: 22,
    paddingBottom: 48,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F4EF",
  },

  loadingText: {
    marginTop: 10,
    color: "#5E6F74",
    fontSize: 15,
  },

  header: {
    alignItems: "center",
    marginBottom: 25,
  },

  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#12343F",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#0D2832",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#12242B",
    textAlign: "center",
    letterSpacing: 0.3,
  },

  subtitle: {
    fontSize: 15,
    color: "#5E6F74",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E6E1D6",
    shadowColor: "#0D2832",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  typeIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F6EFE0",
    justifyContent: "center",
    alignItems: "center",
  },

  typeContainer: {
    marginLeft: 12,
  },

  typeTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#12242B",
    letterSpacing: 0.2,
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
    backgroundColor: "#A8803A",
    marginRight: 6,
  },

  statusText: {
    fontSize: 13,
    color: "#66767B",
  },

  descriptionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#5E6F74",
    marginBottom: 5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  description: {
    fontSize: 15,
    color: "#4A5A60",
    lineHeight: 22,
    marginBottom: 18,
  },

  helpButton: {
    height: 50,
    backgroundColor: "#12343F",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#A8803A",
  },

  helpButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.4,
  },

  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E6E1D6",
    shadowColor: "#0D2832",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#2C3B41",
    marginTop: 15,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 14,
    color: "#66767B",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },

  refreshButton: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#12343F",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 5,
  },

  refreshText: {
    color: "#12343F",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
});