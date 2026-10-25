
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";

import { db } from "../firebaseConfig.js";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

export default function Home() {
  const [fontsLoaded] = useFonts({
    Lobster: require("../assets/fonts/Lobster-Regular.ttf"),
    Montserrat: require("../assets/fonts/Montserrat-VariableFont_wght.ttf"),
  });

  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorSolicitudes, setErrorSolicitudes] = useState(false);

  useEffect(() => {
    const consulta = query(
      collection(db, "solicitudes"),
      orderBy("fecha", "desc")
    );

    const cancelarEscucha = onSnapshot(
      consulta,
      (resultado) => {
        const lista = resultado.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }));

        setSolicitudes(lista);
        setErrorSolicitudes(false);
        setCargando(false);
      },
      (error) => {
        console.log("Error al cargar solicitudes:", error);
        setErrorSolicitudes(true);
        setCargando(false);
      }
    );

    return () => cancelarEscucha();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.cargandoPantalla}>
        <ActivityIndicator size="large" color="#1D3D47" />
      </View>
    );
  }

  const obtenerFecha = (fecha) => {
    if (!fecha || typeof fecha.toDate !== "function") {
      return "Fecha pendiente";
    }

    return fecha.toDate().toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const obtenerColorEstado = (estado) => {
    if (estado === "Atendida" || estado === "Resuelta") {
      return {
        fondo: "#DDF5E7",
        texto: "#247448",
      };
    }

    if (estado === "En proceso") {
      return {
        fondo: "#FFF0D5",
        texto: "#925D12",
      };
    }

    return {
      fondo: "#E8EEF9",
      texto: "#3158A5",
    };
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Bienvenida */}
      <ImageBackground
        source={{
          uri: "https://i.pinimg.com/1200x/a2/0d/6b/a20d6be9b14a1f3186c6e8a3f9ad1120.jpg",
        }}
        style={styles.background}
        imageStyle={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.StyleTitle}>
            <Text style={styles.title}>Bienvenido</Text>

            <Text style={styles.subtitle}>
              Lo que hoy es caos, mañana será el cimiento de tu nueva fortaleza
            </Text>
          </View>
        </View>
      </ImageBackground>

      {/* Encabezado de solicitudes */}
      <View style={styles.seccionSolicitudes}>
        <View style={styles.encabezadoSolicitudes}>
          <View style={styles.iconoEncabezado}>
            <Ionicons
              name="hand-left-outline"
              size={25}
              color="#1D3D47"
            />
          </View>

          <View style={styles.encabezadoTexto}>
            <Text style={styles.tituloSolicitudes}>
              Solicitudes de ayuda
            </Text>

            <Text style={styles.subtituloSolicitudes}>
              Conoce las necesidades de nuestra comunidad.
            </Text>
          </View>
        </View>

        {!cargando && !errorSolicitudes && (
          <View style={styles.contador}>
            <Text style={styles.textoContador}>
              {solicitudes.length}{" "}
              {solicitudes.length === 1
                ? "solicitud registrada"
                : "solicitudes registradas"}
            </Text>
          </View>
        )}

        {/* Cargando */}
        {cargando && (
          <View style={styles.estadoContenedor}>
            <ActivityIndicator size="large" color="#1D3D47" />
            <Text style={styles.textoEstado}>
              Cargando solicitudes...
            </Text>
          </View>
        )}

        {/* Error de conexión o permisos */}
        {!cargando && errorSolicitudes && (
          <View style={styles.estadoContenedor}>
            <Ionicons
              name="cloud-offline-outline"
              size={38}
              color="#9A5555"
            />

            <Text style={styles.textoError}>
              No pudimos cargar las solicitudes.
            </Text>

            <Text style={styles.textoEstado}>
              Revisa tu conexión y los permisos de lectura de Firestore
              para la colección solicitudes.
            </Text>
          </View>
        )}

        {/* Sin solicitudes */}
        {!cargando &&
          !errorSolicitudes &&
          solicitudes.length === 0 && (
            <View style={styles.estadoContenedor}>
              <Ionicons
                name="document-text-outline"
                size={42}
                color="#8A9A9E"
              />

              <Text style={styles.textoVacio}>
                Todavía no hay solicitudes
              </Text>

              <Text style={styles.textoEstado}>
                Cuando alguien solicite ayuda desde Help, su solicitud
                aparecerá aquí.
              </Text>
            </View>
          )}

        {/* Lista de solicitudes */}
        {!cargando &&
          !errorSolicitudes &&
          solicitudes.map((solicitud) => {
            const colorEstado = obtenerColorEstado(
              solicitud.estado
            );

            return (
              <View
                key={solicitud.id}
                style={styles.tarjetaSolicitud}
              >
                <View style={styles.filaTarjeta}>
                  <View style={styles.iconoSolicitud}>
                    <Ionicons
                      name={obtenerIcono(solicitud.tipoAyuda)}
                      size={25}
                      color="#1D3D47"
                    />
                  </View>

                  <View style={styles.datosSolicitud}>
                    <Text style={styles.tipoAyuda}>
                      {solicitud.tipoAyuda || "Otro tipo de ayuda"}
                    </Text>

                    <Text style={styles.fechaSolicitud}>
                      {obtenerFecha(solicitud.fecha)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.estadoEtiqueta,
                      { backgroundColor: colorEstado.fondo },
                    ]}
                  >
                    <Text
                      style={[
                        styles.textoEstadoEtiqueta,
                        { color: colorEstado.texto },
                      ]}
                    >
                      {solicitud.estado || "Pendiente"}
                    </Text>
                  </View>
                </View>

                <View style={styles.divisorTarjeta} />

                <Text style={styles.etiquetaDescripcion}>
                  Descripción de la necesidad
                </Text>

                <Text style={styles.descripcionSolicitud}>
                  {solicitud.descripcion || "Sin descripción"}
                </Text>
              </View>
            );
          })}

        <Text style={styles.pieSolicitudes}>
          Cada solicitud es una oportunidad para ayudar.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8F9",
  },

  content: {
    paddingBottom: 25,
  },

  cargandoPantalla: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F8F9",
  },

  background: {
    width: "100%",
    height: 340,
  },

  backgroundImage: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.30)",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  StyleTitle: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  title: {
    fontFamily: "Montserrat",
    fontSize: 39,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },

  subtitle: {
    fontFamily: "Lobster",
    fontSize: 23,
    marginTop: 15,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 31,
  },

  seccionSolicitudes: {
    paddingHorizontal: 18,
    paddingTop: 25,
  },

  encabezadoSolicitudes: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  iconoEncabezado: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#DCECEF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  encabezadoTexto: {
    flex: 1,
  },

  tituloSolicitudes: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1D3D47",
  },

  subtituloSolicitudes: {
    fontSize: 12,
    color: "#72858A",
    marginTop: 4,
    lineHeight: 18,
  },

  contador: {
    alignSelf: "flex-start",
    backgroundColor: "#E5EFF1",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 15,
  },

  textoContador: {
    color: "#1D3D47",
    fontSize: 12,
    fontWeight: "700",
  },

  estadoContenedor: {
    backgroundColor: "#FFFFFF",
    padding: 25,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5ECEE",
  },

  textoEstado: {
    color: "#72858A",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 10,
  },

  textoError: {
    color: "#9A5555",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
  },

  textoVacio: {
    color: "#1D3D47",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
  },

  tarjetaSolicitud: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 16,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#E4ECEE",
    elevation: 2,
    shadowColor: "#1D3D47",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  filaTarjeta: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconoSolicitud: {
    width: 47,
    height: 47,
    borderRadius: 13,
    backgroundColor: "#EAF3F4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  datosSolicitud: {
    flex: 1,
  },

  tipoAyuda: {
    color: "#1D3D47",
    fontSize: 15,
    fontWeight: "800",
  },

  fechaSolicitud: {
    color: "#8A9A9E",
    fontSize: 11,
    marginTop: 5,
  },

  estadoEtiqueta: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginLeft: 5,
  },

  textoEstadoEtiqueta: {
    fontSize: 10,
    fontWeight: "800",
  },

  divisorTarjeta: {
    height: 1,
    backgroundColor: "#EDF1F2",
    marginVertical: 14,
  },

  etiquetaDescripcion: {
    color: "#72858A",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 7,
  },

  descripcionSolicitud: {
    color: "#374B50",
    fontSize: 14,
    lineHeight: 21,
  },

  pieSolicitudes: {
    color: "#72858A",
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },
});
