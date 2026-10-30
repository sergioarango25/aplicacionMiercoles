import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

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
              placeholderTextColor="#98A3A6"
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
            placeholderTextColor="#98A3A6"
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
            color="#2F6B4F"
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

const SERIF = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia, serif",
});

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F6F4EF",
  },

  encabezado: {
    backgroundColor: "#0D2832",
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 22,
    borderBottomWidth: 3,
    borderBottomColor: "#A8803A",
    marginBottom: 14,
  },

  titulo: {
    fontSize: 30,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
    fontFamily: SERIF,
  },

  mapaContainer: {
    height: 280,
    marginHorizontal: 15,
    borderRadius: 22,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#E6E1D6",
    shadowColor: "#0D2832",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
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
    borderRadius: 14,
    elevation: 4,
    shadowColor: "#0D2832",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },

  botonCentrarTexto: {
    color: "#12343F",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },

  contenido: {
    flex: 1,
    paddingHorizontal: 15,
  },

  tituloSeccion: {
    marginTop: 18,
    marginBottom: 12,
    fontSize: 19,
    fontWeight: "700",
    color: "#12242B",
    letterSpacing: 0.2,
    fontFamily: SERIF,
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
    borderColor: "#E6E1D6",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#0D2832",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  opcionSeleccionada: {
    borderColor: "#12343F",
    backgroundColor: "#EEF3F2",
    borderWidth: 1.5,
  },

  opcionIcono: {
    fontSize: 25,
    marginBottom: 8,
  },

  opcionTitulo: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2C3B41",
  },

  opcionTituloSeleccionado: {
    color: "#12343F",
  },

  opcionTexto: {
    marginTop: 4,
    fontSize: 12,
    color: "#66767B",
  },

  panel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E6E1D6",
    shadowColor: "#0D2832",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  panelTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#12242B",
    letterSpacing: 0.2,
    fontFamily: SERIF,
  },

  panelTexto: {
    marginTop: 5,
    marginBottom: 12,
    fontSize: 13,
    color: "#66767B",
    lineHeight: 18,
  },

  ubicacionSeleccionada: {
    backgroundColor: "#E6F0EA",
    padding: 14,
    borderRadius: 14,
    marginTop: 5,
  },

  ubicacionTitulo: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2F6B4F",
  },

  ubicacionTexto: {
    marginTop: 5,
    fontSize: 12,
    color: "#4A5A60",
  },

  input: {
    backgroundColor: "#FBFAF7",
    borderWidth: 1,
    borderColor: "#D9D3C5",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    color: "#12242B",
    marginBottom: 12,
  },

  botonBuscar: {
    backgroundColor: "#12343F",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#A8803A",
  },

  botonGuardar: {
    backgroundColor: "#2F6B4F",
    paddingVertical: 15,
    borderRadius: 14,
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
    letterSpacing: 0.4,
  },

  tituloLugares: {
    fontSize: 21,
    fontWeight: "700",
    color: "#12242B",
    marginBottom: 12,
    letterSpacing: 0.2,
    fontFamily: SERIF,
  },

  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E6E1D6",
    shadowColor: "#0D2832",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
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
    backgroundColor: "#EAEFEE",
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
    fontWeight: "700",
    color: "#12242B",
    fontFamily: SERIF,
  },

  direccionLugar: {
    marginTop: 4,
    fontSize: 12,
    color: "#66767B",
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
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6E1D6",
  },

  vacioIcono: {
    fontSize: 38,
    marginBottom: 10,
  },

  vacioTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3B41",
  },

  vacioTexto: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 13,
    color: "#66767B",
    lineHeight: 19,
  },

  cargando: {
    marginTop: 20,
  },

  espacioFinal: {
    height: 30,
  },

});

