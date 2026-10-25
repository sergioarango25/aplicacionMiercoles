import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { WebView } from "react-native-webview";

import { auth, db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

export default function Map() {
  const webViewRef = useRef(null);

  // ==============================
  // ESTADOS
  // ==============================

  const [modo, setModo] = useState("mapa");

  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");

  const [latitudSeleccionada, setLatitudSeleccionada] =
    useState(3.4516);

  const [longitudSeleccionada, setLongitudSeleccionada] =
    useState(-76.5320);

  const [direcciones, setDirecciones] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [buscando, setBuscando] = useState(false);

  // ==============================
  // CARGAR DIRECCIONES DE FIREBASE
  // ==============================

  useEffect(() => {
    cargarDirecciones();
  }, []);

  const cargarDirecciones = async () => {
    try {
      const usuario = auth.currentUser;

      if (!usuario) {
        setCargando(false);
        return;
      }

      const consulta = query(
        collection(db, "direcciones"),
        where("userId", "==", usuario.uid)
      );

      const resultado = await getDocs(consulta);

      const lista = resultado.docs.map((documento) => ({
        id: documento.id,
        ...documento.data(),
      }));

      setDirecciones(lista);
    } catch (error) {
      console.log("Error cargando direcciones:", error);

      Alert.alert(
        "Error",
        "No fue posible cargar tus direcciones."
      );
    } finally {
      setCargando(false);
    }
  };

  // ==============================
  // HTML DEL MAPA
  // ==============================

  const mapaHTML = `
    <!DOCTYPE html>

    <html>

    <head>

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      />

      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />

      <script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js">
      </script>

      <style>

        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
        }

        #map {
          width: 100%;
          height: 100%;
        }

      </style>

    </head>

    <body>

      <div id="map"></div>

      <script>

        const map = L.map("map").setView(
          [3.4516, -76.5320],
          13
        );

        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
          }
        ).addTo(map);

        let marcadorSeleccionado = null;

        // ==========================================
        // MARCADOR PRINCIPAL
        // ==========================================

        const marcadorPrincipal = L.marker([
          3.4516,
          -76.5320
        ]).addTo(map);

        marcadorPrincipal.bindPopup(
          "<b>La Esperanza</b><br>Centro de Cali"
        );

        // ==========================================
        // PUNTOS DE AYUDA
        // ==========================================

        const ayuda1 = L.marker([
          3.4550,
          -76.5310
        ]).addTo(map);

        ayuda1.bindPopup(
          "<b>Punto de ayuda</b><br>Centro de Cali"
        );

        const ayuda2 = L.marker([
          3.4380,
          -76.5200
        ]).addTo(map);

        ayuda2.bindPopup(
          "<b>Punto de ayuda</b><br>Zona de emergencia"
        );

        // ==========================================
        // TOCAR MAPA
        // ==========================================

        map.on("click", function(evento) {

          const lat = evento.latlng.lat;
          const lng = evento.latlng.lng;

          if (marcadorSeleccionado) {
            map.removeLayer(marcadorSeleccionado);
          }

          marcadorSeleccionado = L.marker([
            lat,
            lng
          ]).addTo(map);

          marcadorSeleccionado.bindPopup(
            "<b>Ubicación seleccionada</b>"
          ).openPopup();

          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              tipo: "ubicacion",
              latitude: lat,
              longitude: lng
            })
          );

        });

        // ==========================================
        // FUNCION PARA MOSTRAR MARCADOR
        // ==========================================

        function mostrarMarcador(lat, lng, nombre) {

          if (marcadorSeleccionado) {
            map.removeLayer(marcadorSeleccionado);
          }

          marcadorSeleccionado = L.marker([
            lat,
            lng
          ]).addTo(map);

          marcadorSeleccionado.bindPopup(
            "<b>" + nombre + "</b>"
          ).openPopup();

          map.setView(
            [lat, lng],
            17
          );
        }

      </script>

    </body>

    </html>
  `;

  // ==============================
  // RECIBIR UBICACIÓN DEL MAPA
  // ==============================

  const seleccionarUbicacion = (event) => {
    try {
      const datos = JSON.parse(
        event.nativeEvent.data
      );

      if (datos.tipo === "ubicacion") {

        setLatitudSeleccionada(
          datos.latitude
        );

        setLongitudSeleccionada(
          datos.longitude
        );

        setDireccion(
          `${datos.latitude.toFixed(6)}, ${datos.longitude.toFixed(6)}`
        );

      }

    } catch (error) {

      console.log(
        "Error leyendo ubicación:",
        error
      );

    }
  };

  // ==============================
  // BUSCAR DIRECCIÓN MANUAL
  // ==============================

  const buscarDireccion = async () => {

    if (!direccion.trim()) {

      Alert.alert(
        "Dirección vacía",
        "Escribe una dirección para buscar."
      );

      return;
    }

    try {

      setBuscando(true);

      const direccionCodificada =
        encodeURIComponent(
          direccion.trim()
        );

      const respuesta = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${direccionCodificada}&limit=1&countrycodes=co`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "Domingo-App",
          },
        }
      );

      const resultados =
        await respuesta.json();

      if (
        !resultados ||
        resultados.length === 0
      ) {

        Alert.alert(
          "No encontrada",
          "No encontramos esa dirección. Intenta escribirla de otra manera."
        );

        return;
      }

      const resultado =
        resultados[0];

      const lat =
        parseFloat(resultado.lat);

      const lon =
        parseFloat(resultado.lon);

      setLatitudSeleccionada(lat);
      setLongitudSeleccionada(lon);

      setDireccion(
        resultado.display_name
      );

      webViewRef.current?.injectJavaScript(`
        mostrarMarcador(
          ${lat},
          ${lon},
          "Ubicación encontrada"
        );
        true;
      `);

    } catch (error) {

      console.log(
        "Error buscando dirección:",
        error
      );

      Alert.alert(
        "Error",
        "No fue posible buscar la dirección."
      );

    } finally {

      setBuscando(false);

    }
  };

  // ==============================
  // MOSTRAR UBICACIÓN SELECCIONADA
  // ==============================

  const mostrarUbicacion = () => {

    webViewRef.current?.injectJavaScript(`
      mostrarMarcador(
        ${latitudSeleccionada},
        ${longitudSeleccionada},
        "Ubicación seleccionada"
      );
      true;
    `);

  };

  // ==============================
  // GUARDAR EN FIREBASE
  // ==============================

  const guardarDireccion = async () => {

    if (!nombre.trim()) {

      Alert.alert(
        "Falta información",
        "Escribe un nombre para el lugar."
      );

      return;
    }

    if (!direccion.trim()) {

      Alert.alert(
        "Falta información",
        "Selecciona o busca una dirección."
      );

      return;
    }

    try {

      const usuario =
        auth.currentUser;

      if (!usuario) {

        Alert.alert(
          "Sesión no encontrada",
          "Debes iniciar sesión para guardar una dirección."
        );

        return;
      }

      setGuardando(true);

      await addDoc(
        collection(
          db,
          "direcciones"
        ),
        {
          userId: usuario.uid,

          nombre:
            nombre.trim(),

          direccion:
            direccion.trim(),

          latitude:
            latitudSeleccionada,

          longitude:
            longitudSeleccionada,

          createdAt:
            serverTimestamp(),
        }
      );

      Alert.alert(
        "Lugar guardado",
        "La dirección se guardó correctamente."
      );

      setNombre("");
      setDireccion("");

      await cargarDirecciones();

    } catch (error) {

      console.log(
        "Error guardando dirección:",
        error
      );

      Alert.alert(
        "Error",
        "No fue posible guardar la dirección."
      );

    } finally {

      setGuardando(false);

    }
  };

  // ==============================
  // ELIMINAR DIRECCIÓN
  // ==============================

  const eliminarDireccion = (id) => {

    Alert.alert(
      "Eliminar lugar",
      "¿Quieres eliminar esta dirección?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },

        {
          text: "Eliminar",
          style: "destructive",

          onPress: async () => {

            try {

              await deleteDoc(
                doc(
                  db,
                  "direcciones",
                  id
                )
              );

              await cargarDirecciones();

              Alert.alert(
                "Eliminado",
                "La dirección fue eliminada."
              );

            } catch (error) {

              console.log(
                "Error eliminando:",
                error
              );

              Alert.alert(
                "Error",
                "No fue posible eliminar la dirección."
              );

            }

          },
        },
      ]
    );

  };

  // ==============================
  // MOSTRAR DIRECCIÓN GUARDADA
  // ==============================

  const mostrarDireccionGuardada = (
    item
  ) => {

    setLatitudSeleccionada(
      item.latitude
    );

    setLongitudSeleccionada(
      item.longitude
    );

    setDireccion(
      item.direccion
    );

    webViewRef.current?.injectJavaScript(`
      mostrarMarcador(
        ${item.latitude},
        ${item.longitude},
        "${item.nombre}"
      );
      true;
    `);

  };

  // ==============================
  // CAMBIAR MODO
  // ==============================

  const cambiarModo = (nuevoModo) => {

    setModo(nuevoModo);

    if (nuevoModo === "mapa") {

      setDireccion("");

    }

  };

  // ==============================
  // INTERFAZ
  // ==============================

  return (

    <View style={styles.container}>

      {/* ENCABEZADO */}

      <View style={styles.encabezado}>

        <Text style={styles.titulo}>
          Mapa de emergencia
        </Text>



      </View>

      {/* MAPA */}

      <View style={styles.mapaContainer}>

        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{
            html: mapaHTML,
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={seleccionarUbicacion}
          style={styles.mapa}
        />

        <TouchableOpacity
          style={styles.botonCentrar}
          onPress={mostrarUbicacion}
        >

          <Text style={styles.botonCentrarTexto}>
            📍 Centrar
          </Text>

        </TouchableOpacity>

      </View>

      <ScrollView
        style={styles.contenido}
        showsVerticalScrollIndicator={false}
      >

        {/* TITULO DE SELECCION */}

        <Text style={styles.tituloSeccion}>
          ¿Cómo quieres agregar el lugar?
        </Text>

        {/* OPCIONES */}

        <View style={styles.opciones}>

          <TouchableOpacity
            style={[
              styles.opcion,
              modo === "mapa" &&
                styles.opcionSeleccionada,
            ]}
            onPress={() =>
              cambiarModo("mapa")
            }
          >

            <Text style={styles.opcionIcono}>
              📍
            </Text>

            <Text
              style={[
                styles.opcionTitulo,
                modo === "mapa" &&
                  styles.opcionTituloSeleccionado,
              ]}
            >
              Desde el mapa
            </Text>

            <Text style={styles.opcionTexto}>
              Toca un punto
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.opcion,
              modo === "direccion" &&
                styles.opcionSeleccionada,
            ]}
            onPress={() =>
              cambiarModo("direccion")
            }
          >

            <Text style={styles.opcionIcono}>
              🔎
            </Text>

            <Text
              style={[
                styles.opcionTitulo,
                modo === "direccion" &&
                  styles.opcionTituloSeleccionado,
              ]}
            >
              Escribir dirección
            </Text>

            <Text style={styles.opcionTexto}>
              Busca una dirección
            </Text>

          </TouchableOpacity>

        </View>

        {/* MODO MAPA */}

        {modo === "mapa" && (

          <View style={styles.panel}>

            <Text style={styles.panelTitulo}>
              Selecciona una ubicación
            </Text>

            <Text style={styles.panelTexto}>
              Toca directamente sobre el mapa para elegir el lugar.
            </Text>

            {direccion !== "" && (

              <View style={styles.ubicacionSeleccionada}>

                <Text style={styles.ubicacionTitulo}>
                  📍 Ubicación seleccionada
                </Text>

                <Text style={styles.ubicacionTexto}>
                  {direccion}
                </Text>

              </View>

            )}

          </View>

        )}

        {/* MODO DIRECCION */}

        {modo === "direccion" && (

          <View style={styles.panel}>

            <Text style={styles.panelTitulo}>
              Escribe la dirección
            </Text>

            <Text style={styles.panelTexto}>
              Escribe una dirección y la ubicaremos automáticamente en el mapa.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ej: Calle 5 # 10-20, Cali"
              placeholderTextColor="#999999"
              value={direccion}
              onChangeText={setDireccion}
            />

            <TouchableOpacity
              style={[
                styles.botonBuscar,
                buscando &&
                  styles.botonDesactivado,
              ]}
              onPress={buscarDireccion}
              disabled={buscando}
            >

              {buscando ? (

                <ActivityIndicator
                  color="#FFFFFF"
                />

              ) : (

                <Text style={styles.textoBoton}>
                  🔎 Buscar dirección
                </Text>

              )}

            </TouchableOpacity>

          </View>

        )}

        {/* FORMULARIO */}

        <View style={styles.panel}>

          <Text style={styles.panelTitulo}>
            Nombre del lugar
          </Text>

          <Text style={styles.panelTexto}>
            Dale un nombre para reconocerlo fácilmente.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ej: Casa, Universidad, Trabajo..."
            placeholderTextColor="#999999"
            value={nombre}
            onChangeText={setNombre}
          />

          <TouchableOpacity
            style={[
              styles.botonGuardar,
              guardando &&
                styles.botonDesactivado,
            ]}
            onPress={guardarDireccion}
            disabled={guardando}
          >

            {guardando ? (

              <ActivityIndicator
                color="#FFFFFF"
              />

            ) : (

              <Text style={styles.textoBoton}>
                💾 Guardar lugar
              </Text>

            )}

          </TouchableOpacity>

        </View>

        {/* MIS LUGARES */}

        <Text style={styles.tituloLugares}>
          Mis lugares guardados
        </Text>

        {cargando ? (

          <ActivityIndicator
            size="large"
            color="#2E7D32"
            style={styles.cargando}
          />

        ) : direcciones.length === 0 ? (

          <View style={styles.vacio}>

            <Text style={styles.vacioIcono}>
              📍
            </Text>

            <Text style={styles.vacioTitulo}>
              Todavía no tienes lugares
            </Text>

            <Text style={styles.vacioTexto}>
              Selecciona un punto del mapa o escribe una dirección para comenzar.
            </Text>

          </View>

        ) : (

          direcciones.map((item) => (

            <View
              key={item.id}
              style={styles.tarjeta}
            >

              <TouchableOpacity
                style={styles.infoTarjeta}
                onPress={() =>
                  mostrarDireccionGuardada(item)
                }
              >

                <View style={styles.iconoLugar}>

                  <Text style={styles.iconoLugarTexto}>
                    📍
                  </Text>

                </View>

                <View style={styles.textosTarjeta}>

                  <Text style={styles.nombreLugar}>
                    {item.nombre}
                  </Text>

                  <Text
                    style={styles.direccionLugar}
                    numberOfLines={2}
                  >
                    {item.direccion}
                  </Text>

                </View>

              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botonEliminar}
                onPress={() =>
                  eliminarDireccion(item.id)
                }
              >

                <Text style={styles.textoEliminar}>
                  🗑️
                </Text>

              </TouchableOpacity>

            </View>

          ))

        )}

        <View style={styles.espacioFinal} />

      </ScrollView>

    </View>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F5F7F5",
  },

  encabezado: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },

  titulo: {
    fontSize: 35,
    fontWeight: "bold",
    color: "#222222",
  },

  mapaContainer: {
    height: 280,
    marginHorizontal: 15,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },

  mapa: {
    flex: 1,
  },

  botonCentrar: {
    position: "absolute",
    right: 15,
    bottom: 15,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 12,
    elevation: 4,
  },

  botonCentrarTexto: {
    color: "#333333",
    fontSize: 14,
    fontWeight: "bold",
  },

  contenido: {
    flex: 1,
    paddingHorizontal: 15,
  },

  tituloSeccion: {
    marginTop: 18,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: "bold",
    color: "#222222",
  },

  opciones: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },

  opcion: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 15,
    padding: 15,
  },

  opcionSeleccionada: {
    borderColor: "#2E7D32",
    backgroundColor: "#E8F5E9",
  },

  opcionIcono: {
    fontSize: 25,
    marginBottom: 8,
  },

  opcionTitulo: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
  },

  opcionTituloSeleccionado: {
    color: "#2E7D32",
  },

  opcionTexto: {
    marginTop: 4,
    fontSize: 12,
    color: "#777777",
  },

  panel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },

  panelTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222222",
  },

  panelTexto: {
    marginTop: 5,
    marginBottom: 12,
    fontSize: 13,
    color: "#777777",
    lineHeight: 18,
  },

  ubicacionSeleccionada: {
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 10,
    marginTop: 5,
  },

  ubicacionTitulo: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2E7D32",
  },

  ubicacionTexto: {
    marginTop: 5,
    fontSize: 12,
    color: "#555555",
  },

  input: {
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    color: "#222222",
    marginBottom: 12,
  },

  botonBuscar: {
    backgroundColor: "#1565C0",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  botonGuardar: {
    backgroundColor: "#2E7D32",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
  },

  botonDesactivado: {
    opacity: 0.6,
  },

  textoBoton: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  tituloLugares: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222222",
    marginBottom: 12,
  },

  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },

  infoTarjeta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  iconoLugar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  iconoLugarTexto: {
    fontSize: 20,
  },

  textosTarjeta: {
    flex: 1,
  },

  nombreLugar: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222222",
  },

  direccionLugar: {
    marginTop: 4,
    fontSize: 12,
    color: "#777777",
    lineHeight: 17,
  },

  botonEliminar: {
    padding: 10,
    marginLeft: 5,
  },

  textoEliminar: {
    fontSize: 18,
  },

  vacio: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
  },

  vacioIcono: {
    fontSize: 38,
    marginBottom: 10,
  },

  vacioTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },

  vacioTexto: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 13,
    color: "#777777",
    lineHeight: 19,
  },

  cargando: {
    marginTop: 20,
  },

  espacioFinal: {
    height: 30,
  },

});