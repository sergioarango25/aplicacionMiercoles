import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
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

// ==============================
// CACHÉ (AsyncStorage con vencimiento)
// ==============================

const HORA = 60 * 60 * 1000;
const TTL_DIRECCIONES = 24 * HORA; // direcciones guardadas
const TTL_GEOCODIFICACION = 30 * 24 * HORA; // búsquedas / geocodificación inversa
const TTL_POSICION = 7 * 24 * HORA; // última posición conocida

const cacheGuardar = async (clave, valor) => {
  try {
    await AsyncStorage.setItem(
      `mapa:${clave}`,
      JSON.stringify({ t: Date.now(), v: valor })
    );
  } catch (e) {
    console.log("Error guardando caché:", e);
  }
};

// Devuelve { valor, vencido } o null si no existe
const cacheLeer = async (clave, ttl) => {
  try {
    const crudo = await AsyncStorage.getItem(`mapa:${clave}`);
    if (!crudo) return null;
    const { t, v } = JSON.parse(crudo);
    return { valor: v, vencido: Date.now() - t > ttl };
  } catch (e) {
    return null;
  }
};

// ==============================
// COORDENADAS
// ==============================

const CALI = { latitude: 3.4516, longitude: -76.532 };

// Caja aproximada de Cali y alrededores (para priorizar búsquedas)
// formato Nominatim: left,top,right,bottom
const VIEWBOX_CALI = "-76.65,3.55,-76.40,3.30";

// Redondea a 6 decimales (~11 cm), limita a rangos válidos
// y ajusta la longitud si el mapa se desplazó más de 180°
const normalizarCoordenadas = (lat, lng) => {
  const latitude = Number(lat);
  let longitude = Number(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  longitude = ((((longitude + 180) % 360) + 360) % 360) - 180;

  if (latitude < -90 || latitude > 90) return null;

  return {
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
  };
};

const claveCoordenadas = (lat, lng) =>
  `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;

export default function Map() {
  const webViewRef = useRef(null);
  const posicionInicial = useRef(null);
  const scrollRef = useRef(null);
  const [tecladoVisible, setTecladoVisible] = useState(false);
  const [alturaTeclado, setAlturaTeclado] = useState(0);

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
  const [ubicando, setUbicando] = useState(false);
  const [precision, setPrecision] = useState(null);

  // ==============================
  // CARGAR DIRECCIONES DE FIREBASE
  // ==============================

  useEffect(() => {
    cargarDirecciones();
    restaurarUltimaPosicion();
  }, []);

  // Detectar teclado: se oculta el mapa mientras se escribe
  // y se deja espacio para que el campo quede visible
  useEffect(() => {
    const mostrar = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setTecladoVisible(true);
        setAlturaTeclado(e.endCoordinates?.height || 0);
      }
    );
    const ocultar = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setTecladoVisible(false);
        setAlturaTeclado(0);
      }
    );
    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, []);

  // Restaura la última posición conocida (caché) para que el mapa
  // abra de inmediato donde el usuario estaba
  const restaurarUltimaPosicion = async () => {
    const guardada = await cacheLeer("ultimaPosicion", TTL_POSICION);
    if (guardada && !guardada.vencido) {
      const c = normalizarCoordenadas(
        guardada.valor.latitude,
        guardada.valor.longitude
      );
      if (c) {
        setLatitudSeleccionada(c.latitude);
        setLongitudSeleccionada(c.longitude);
        posicionInicial.current = c;
        moverMapa(c.latitude, c.longitude);
      }
    }
  };

  const moverMapa = (lat, lng, zoom = 15) => {
    webViewRef.current?.injectJavaScript(
      `if (typeof irA === "function") { irA(${lat}, ${lng}, ${zoom}); } true;`
    );
  };

  const cargarDirecciones = async (forzar = false) => {
    try {
      const usuario = auth.currentUser;

      if (!usuario) {
        setCargando(false);
        return;
      }

      const claveLista = `direcciones:${usuario.uid}`;

      // 1) Mostrar al instante lo que hay en caché
      const enCache = await cacheLeer(claveLista, TTL_DIRECCIONES);
      if (enCache) {
        setDirecciones(enCache.valor);
        setCargando(false);

        // Caché vigente y no forzado: no hace falta ir a Firebase
        if (!enCache.vencido && !forzar) return;
      }

      // 2) Actualizar desde Firebase
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
      await cacheGuardar(claveLista, lista);
    } catch (error) {
      console.log("Error cargando direcciones:", error);

      // Si hay caché (aunque esté vencido) ya se mostró; solo avisar si no hay nada
      if (direcciones.length === 0) {
        Alert.alert(
          "Error",
          "No fue posible cargar tus direcciones."
        );
      }
    } finally {
      setCargando(false);
    }
  };

  // ==============================
  // HTML DEL MAPA
  // ==============================

  const mapaHTML = useMemo(() => `
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

        const map = L.map("map", {
          worldCopyJump: true,
          maxBounds: [[-85, -180], [85, 180]],
          maxBoundsViscosity: 1.0
        }).setView(
          [${CALI.latitude}, ${CALI.longitude}],
          13
        );

        // ==========================================
        // CACHÉ DE TESELAS (IndexedDB)
        // Guarda cada tesela descargada y la reutiliza
        // (también sin internet). Si IndexedDB falla,
        // usa la red normalmente.
        // ==========================================

        const TILE_TTL = 14 * 24 * 60 * 60 * 1000;
        const TILE_MAX = 1500;
        let tileDB = null;

        const abrirTileDB = () => new Promise((resolve) => {
          try {
            const req = indexedDB.open("tiles-mapa", 1);
            req.onupgradeneeded = () => {
              req.result.createObjectStore("tiles");
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
          } catch (e) { resolve(null); }
        });

        const tileGet = (key) => new Promise((resolve) => {
          if (!tileDB) return resolve(null);
          try {
            const r = tileDB
              .transaction("tiles")
              .objectStore("tiles")
              .get(key);
            r.onsuccess = () => resolve(r.result || null);
            r.onerror = () => resolve(null);
          } catch (e) { resolve(null); }
        });

        const tilePut = (key, blob) => {
          if (!tileDB) return;
          try {
            const store = tileDB
              .transaction("tiles", "readwrite")
              .objectStore("tiles");
            store.put({ blob: blob, t: Date.now() }, key);
            const c = store.count();
            c.onsuccess = () => {
              if (c.result > TILE_MAX) {
                const k = store.openCursor();
                let borrar = c.result - TILE_MAX;
                k.onsuccess = () => {
                  const cur = k.result;
                  if (cur && borrar-- > 0) {
                    cur.delete();
                    cur.continue();
                  }
                };
              }
            };
          } catch (e) {}
        };

        const CapaCache = L.TileLayer.extend({
          createTile: function(coords, done) {
            const img = document.createElement("img");
            img.alt = "";
            img.setAttribute("role", "presentation");
            const url = this.getTileUrl(coords);
            const key = coords.z + "/" + coords.x + "/" + coords.y;

            const desdeRed = () => {
              fetch(url)
                .then((r) => {
                  if (!r.ok) throw new Error("tile");
                  return r.blob();
                })
                .then((blob) => {
                  tilePut(key, blob);
                  img.src = URL.createObjectURL(blob);
                })
                .catch(() => {
                  img.src = url; // último recurso
                });
            };

            img.onload = () => done(null, img);
            img.onerror = () => done(null, img);

            tileGet(key).then((item) => {
              if (item && item.blob) {
                img.src = URL.createObjectURL(item.blob);
                // refrescar en segundo plano si ya venció
                if (Date.now() - item.t > TILE_TTL && navigator.onLine) {
                  fetch(url)
                    .then((r) => r.ok ? r.blob() : null)
                    .then((b) => b && tilePut(key, b))
                    .catch(() => {});
                }
              } else {
                desdeRed();
              }
            });

            return img;
          }
        });

        abrirTileDB().then((db) => {
          tileDB = db;
          new CapaCache(
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              maxZoom: 19,
              attribution: "&copy; OpenStreetMap contributors"
            }
          ).addTo(map);
        });

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

        function irA(lat, lng, zoom) {
          map.setView([lat, lng], zoom || 15);
        }

        function mostrarMarcador(lat, lng, nombre) {

          if (marcadorSeleccionado) {
            map.removeLayer(marcadorSeleccionado);
          }

          marcadorSeleccionado = L.marker([
            lat,
            lng
          ]).addTo(map);

          const titulo = document.createElement("b");
          titulo.textContent = nombre;
          marcadorSeleccionado.bindPopup(titulo).openPopup();

          map.setView(
            [lat, lng],
            17
          );
        }

      </script>

    </body>

    </html>
  `, []);

  // ==============================
  // RECIBIR UBICACIÓN DEL MAPA
  // ==============================

  const seleccionarUbicacion = async (event) => {
    try {
      const datos = JSON.parse(
        event.nativeEvent.data
      );

      if (datos.tipo !== "ubicacion") return;

      const c = normalizarCoordenadas(
        datos.latitude,
        datos.longitude
      );

      if (!c) return;

      setLatitudSeleccionada(c.latitude);
      setLongitudSeleccionada(c.longitude);
      setPrecision(null);

      // Mientras llega la dirección real, mostrar coordenadas
      const textoCoordenadas =
        `${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}`;
      setDireccion(textoCoordenadas);

      const nombreLugar = await geocodificacionInversa(
        c.latitude,
        c.longitude
      );

      if (nombreLugar) setDireccion(nombreLugar);

    } catch (error) {

      console.log(
        "Error leyendo ubicación:",
        error
      );

    }
  };

  // ==============================
  // GEOCODIFICACIÓN INVERSA (con caché)
  // coordenadas -> dirección legible
  // ==============================

  const geocodificacionInversa = async (lat, lng) => {
    const clave = `inversa:${claveCoordenadas(lat, lng)}`;

    const enCache = await cacheLeer(clave, TTL_GEOCODIFICACION);
    if (enCache && !enCache.vencido) return enCache.valor;

    try {
      const respuesta = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&accept-language=es`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "Domingo-App",
          },
        }
      );

      const datos = await respuesta.json();

      if (datos && datos.display_name) {
        await cacheGuardar(clave, datos.display_name);
        return datos.display_name;
      }
    } catch (error) {
      console.log("Error en geocodificación inversa:", error);
    }

    // Sin red: usar caché vencido si existe
    return enCache ? enCache.valor : null;
  };

  // ==============================
  // USAR MI UBICACIÓN (GPS)
  // ==============================

  const usarMiUbicacion = async () => {
    try {
      setUbicando(true);

      const permiso =
        await Location.requestForegroundPermissionsAsync();

      if (permiso.status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Activa el permiso de ubicación para usar tu posición actual."
        );
        return;
      }

      // Posición rápida (última conocida) para que el mapa responda ya
      const rapida = await Location.getLastKnownPositionAsync();
      if (rapida) {
        moverMapa(rapida.coords.latitude, rapida.coords.longitude, 15);
      }

      // Posición precisa
      const posicion = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const c = normalizarCoordenadas(
        posicion.coords.latitude,
        posicion.coords.longitude
      );

      if (!c) {
        throw new Error("Coordenadas inválidas");
      }

      setLatitudSeleccionada(c.latitude);
      setLongitudSeleccionada(c.longitude);
      setPrecision(
        posicion.coords.accuracy
          ? Math.round(posicion.coords.accuracy)
          : null
      );

      await cacheGuardar("ultimaPosicion", c);

      webViewRef.current?.injectJavaScript(`
        mostrarMarcador(
          ${c.latitude},
          ${c.longitude},
          "Tu ubicación"
        );
        true;
      `);

      const nombreLugar = await geocodificacionInversa(
        c.latitude,
        c.longitude
      );

      setDireccion(
        nombreLugar ||
          `${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}`
      );

    } catch (error) {
      console.log("Error obteniendo ubicación:", error);
      Alert.alert(
        "Error",
        "No fue posible obtener tu ubicación. Revisa que el GPS esté activo."
      );
    } finally {
      setUbicando(false);
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

      const consultaTexto = direccion.trim();
      const claveBusqueda =
        `busqueda:${consultaTexto.toLowerCase()}`;

      let resultados;

      const enCache = await cacheLeer(
        claveBusqueda,
        TTL_GEOCODIFICACION
      );

      if (enCache && !enCache.vencido) {
        resultados = enCache.valor;
      } else {
        const direccionCodificada =
          encodeURIComponent(consultaTexto);

        // viewbox prioriza Cali pero sin excluir el resto de Colombia
        const respuesta = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${direccionCodificada}&limit=1&countrycodes=co&addressdetails=0&accept-language=es&viewbox=${VIEWBOX_CALI}&bounded=0`,
          {
            headers: {
              Accept: "application/json",
              "User-Agent": "Domingo-App",
            },
          }
        );

        resultados = await respuesta.json();

        if (resultados && resultados.length > 0) {
          await cacheGuardar(claveBusqueda, resultados);
        }
      }

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

      const c = normalizarCoordenadas(
        resultado.lat,
        resultado.lon
      );

      if (!c) {
        Alert.alert(
          "Error",
          "La búsqueda devolvió coordenadas inválidas."
        );
        return;
      }

      const lat = c.latitude;
      const lon = c.longitude;

      setLatitudSeleccionada(lat);
      setLongitudSeleccionada(lon);
      setPrecision(null);

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
            normalizarCoordenadas(
              latitudSeleccionada,
              longitudSeleccionada
            )?.latitude ?? latitudSeleccionada,

          longitude:
            normalizarCoordenadas(
              latitudSeleccionada,
              longitudSeleccionada
            )?.longitude ?? longitudSeleccionada,

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

      await cargarDirecciones(true);

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

              await cargarDirecciones(true);

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
        ${JSON.stringify(String(item.nombre || ""))}
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

    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >

      {/* ENCABEZADO */}

      <View style={styles.encabezado}>

        <Text style={styles.titulo}>
          Mapa de emergencia
        </Text>

        <Text style={styles.subtitulo}>
          Guarda y consulta tus lugares de referencia
        </Text>



      </View>

      {/* MAPA */}

      <View
        style={[
          styles.mapaContainer,
          tecladoVisible && styles.mapaOculto,
        ]}
      >

        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{
            html: mapaHTML,
            baseUrl: "https://app.local/",
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          cacheEnabled={true}
          cacheMode="LOAD_CACHE_ELSE_NETWORK"
          onLoadEnd={() => {
            const p = posicionInicial.current;
            if (p) moverMapa(p.latitude, p.longitude);
          }}
          onMessage={seleccionarUbicacion}
          style={styles.mapa}
        />

        <TouchableOpacity
          style={[styles.botonCentrar, { bottom: 64 }]}
          onPress={usarMiUbicacion}
          disabled={ubicando}
        >

          {ubicando ? (
            <ActivityIndicator size="small" />
          ) : (
            <View style={styles.botonMapaFila}>
              <Ionicons name="locate-outline" size={18} color="#12343F" />
              <Text style={styles.botonCentrarTexto}>
                Mi ubicación
              </Text>
            </View>
          )}

        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonCentrar}
          onPress={mostrarUbicacion}
        >

          <View style={styles.botonMapaFila}>
            <Ionicons name="navigate-outline" size={18} color="#12343F" />
            <Text style={styles.botonCentrarTexto}>
              Centrar
            </Text>
          </View>

        </TouchableOpacity>

      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.contenido}
        contentContainerStyle={{
          paddingBottom: 40 + (Platform.OS === "android" ? alturaTeclado : 0),
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={true}
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

            <Ionicons
              name="location-outline"
              size={26}
              color={modo === "mapa" ? "#12343F" : "#8C979A"}
              style={styles.opcionIcono}
            />

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

            <Ionicons
              name="search-outline"
              size={26}
              color={modo === "direccion" ? "#12343F" : "#8C979A"}
              style={styles.opcionIcono}
            />

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

                <View style={styles.botonMapaFila}>
                  <Ionicons name="checkmark-circle" size={18} color="#2F6B4F" />
                  <Text style={styles.ubicacionTitulo}>
                    Ubicación seleccionada
                  </Text>
                </View>

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
              returnKeyType="search"
              onSubmitEditing={buscarDireccion}
              autoCorrect={false}
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

                <View style={styles.botonMapaFila}>
                  <Ionicons name="search" size={18} color="#FFFFFF" />
                  <Text style={styles.textoBoton}>
                    Buscar dirección
                  </Text>
                </View>

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
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
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

              <View style={styles.botonMapaFila}>
                <Ionicons name="bookmark-outline" size={18} color="#FFFFFF" />
                <Text style={styles.textoBoton}>
                  Guardar lugar
                </Text>
              </View>

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

            <Ionicons
              name="location-outline"
              size={40}
              color="#8C979A"
              style={styles.vacioIcono}
            />

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

                  <Ionicons
                    name="location"
                    size={22}
                    color="#12343F"
                  />

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

                <Ionicons
                  name="trash-outline"
                  size={21}
                  color="#A33A3A"
                />

              </TouchableOpacity>

            </View>

          ))

        )}

        <View style={styles.espacioFinal} />

      </ScrollView>

    </KeyboardAvoidingView>
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

  subtitulo: {
    marginTop: 4,
    fontSize: 13,
    color: "#B8C7CB",
    letterSpacing: 0.2,
  },

  botonMapaFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  mapaOculto: {
    height: 0,
    marginTop: 0,
    marginBottom: 0,
    borderWidth: 0,
    opacity: 0,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6E1D6",
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
    marginBottom: 10,
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
    marginTop: 6,
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
    borderRadius: 12,
    backgroundColor: "#FBEFEF",
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