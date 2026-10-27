import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebaseConfig";

const ROLES = [
  "Voluntario",
  "Logística",
  "Apoyo en suministros",
];

const ZONAS = [
  { nombre: "Zona segura", distancia: "" },
  { nombre: "Refugio San Miguel", distancia: "1.2 km" },
  { nombre: "Punto de alimentación", distancia: "1.5 km" },
];

export default function PerfilUsuario() {
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Registro e inicio de sesión
  const [modoRegistro, setModoRegistro] = useState(true);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmPassword, setMostrarConfirmPassword] =
    useState(false);

  // Referencias para avanzar entre los campos
  const nombreRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  // Identifica el campo que está seleccionado
  const [campoActivo, setCampoActivo] = useState(null);

  // Información del perfil
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tipoParticipacion, setTipoParticipacion] =
    useState("Voluntario");
  const [disponible, setDisponible] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          if (!firebaseUser) {
            setUser(null);
            setCargando(false);
            return;
          }

          const referencia = doc(
            db,
            "usuarios",
            firebaseUser.uid
          );

          const resultado = await getDoc(referencia);

          if (resultado.exists()) {
            const datos = resultado.data();

            setUser({
              ...datos,
              uid: firebaseUser.uid,
              email: datos.email || firebaseUser.email,
              nombre:
                datos.nombre ||
                firebaseUser.displayName ||
                "Usuario",
            });

            setTipoParticipacion(
              datos.tipoParticipacion || "Voluntario"
            );

            setDisponible(
              datos.disponible === undefined
                ? true
                : datos.disponible
            );
          } else {
            // Crear un perfil básico si la cuenta ya existe.
            const perfilInicial = {
              uid: firebaseUser.uid,
              nombre: firebaseUser.displayName || "Usuario",
              email: firebaseUser.email || "",
              rol: "usuario",
              tipoParticipacion: "Voluntario",
              disponible: true,
              fechaRegistro: serverTimestamp(),
            };

            await setDoc(referencia, perfilInicial, {
              merge: true,
            });

            setUser({
              ...perfilInicial,
              email: firebaseUser.email || "",
            });

            setTipoParticipacion("Voluntario");
            setDisponible(true);
          }
        } catch (error) {
          console.log("Error al cargar el perfil:", error);

          Alert.alert(
            "Error",
            "No se pudo cargar tu perfil. Revisa tu conexión y los permisos de Firebase."
          );

          setUser(null);
        } finally {
          setCargando(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  // REGISTRAR USUARIO
  const registrarUsuario = async () => {
    const nombreLimpio = nombre.trim();
    const correo = email.trim().toLowerCase();

    if (
      !nombreLimpio ||
      !correo ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        "Campos incompletos",
        "Completa todos los campos."
      );
      return;
    }

    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correoValido.test(correo)) {
      Alert.alert(
        "Correo inválido",
        "Escribe un correo válido."
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Contraseña insegura",
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Error",
        "Las contraseñas no coinciden."
      );
      return;
    }

    try {
      setGuardando(true);

      const credencial = await createUserWithEmailAndPassword(
        auth,
        correo,
        password
      );

      const nuevoUsuario = {
        uid: credencial.user.uid,
        nombre: nombreLimpio,
        email: correo,
        rol: "usuario",
        tipoParticipacion: "Voluntario",
        disponible: true,
        fechaRegistro: serverTimestamp(),
      };

      await setDoc(
        doc(db, "usuarios", credencial.user.uid),
        nuevoUsuario
      );

      setUser({
        ...nuevoUsuario,
        email: correo,
      });

      setTipoParticipacion("Voluntario");
      setDisponible(true);

      setNombre("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      Alert.alert(
        "¡Bienvenido!",
        "Tu cuenta fue creada correctamente."
      );
    } catch (error) {
      console.log("Error al registrar:", error);

      let mensaje =
        "No se pudo crear la cuenta. Inténtalo de nuevo.";

      if (error.code === "auth/email-already-in-use") {
        mensaje = "Este correo ya está registrado. Inicia sesión.";
      } else if (error.code === "auth/invalid-email") {
        mensaje = "El correo electrónico no es válido.";
      } else if (error.code === "auth/weak-password") {
        mensaje = "La contraseña es demasiado débil.";
      } else if (error.code === "auth/network-request-failed") {
        mensaje = "Revisa tu conexión a internet.";
      } else if (error.code === "permission-denied") {
        mensaje =
          "Firebase no permite guardar el perfil. Revisa las reglas de Firestore.";
      }

      Alert.alert("No se pudo registrar", mensaje);
    } finally {
      setGuardando(false);
    }
  };

  // INICIAR SESIÓN
  const iniciarSesion = async () => {
    const correo = email.trim().toLowerCase();

    if (!correo || !password) {
      Alert.alert(
        "Campos incompletos",
        "Escribe tu correo y contraseña."
      );
      return;
    }

    try {
      setGuardando(true);

      await signInWithEmailAndPassword(
        auth,
        correo,
        password
      );

      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.log("Error al iniciar sesión:", error);

      let mensaje = "No se pudo iniciar sesión.";

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        mensaje = "El correo o la contraseña son incorrectos.";
      } else if (error.code === "auth/invalid-email") {
        mensaje = "Escribe un correo válido.";
      } else if (error.code === "auth/network-request-failed") {
        mensaje = "Revisa tu conexión a internet.";
      }

      Alert.alert("Error de inicio de sesión", mensaje);
    } finally {
      setGuardando(false);
    }
  };

  // ABRIR FORMULARIO DEL PERFIL
  const abrirFormulario = () => {
    setTipoParticipacion(
      user?.tipoParticipacion || "Voluntario"
    );

    setDisponible(
      user?.disponible === undefined
        ? true
        : user.disponible
    );

    setMostrarFormulario(true);
  };

  // GUARDAR INFORMACIÓN DEL PERFIL
  const guardarInformacion = async () => {
    if (!auth.currentUser) {
      Alert.alert(
        "Sesión cerrada",
        "Inicia sesión para editar tu perfil."
      );
      return;
    }

    try {
      setGuardando(true);

      const referencia = doc(
        db,
        "usuarios",
        auth.currentUser.uid
      );

      await updateDoc(referencia, {
        tipoParticipacion,
        disponible,
      });

      setUser((anterior) => ({
        ...anterior,
        tipoParticipacion,
        disponible,
      }));

      setMostrarFormulario(false);

      Alert.alert(
        "¡Guardado!",
        "Tu perfil se actualizó correctamente."
      );
    } catch (error) {
      console.log("Error al guardar el perfil:", error);

      Alert.alert(
        "Error",
        "No se pudo guardar la información. Verifica los permisos de Firestore."
      );
    } finally {
      setGuardando(false);
    }
  };

  // CERRAR SESIÓN
  const cerrarSesion = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Quieres salir de tu cuenta?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              setMostrarFormulario(false);
              setPassword("");
              setConfirmPassword("");
            } catch (error) {
              Alert.alert(
                "Error",
                "No se pudo cerrar la sesión."
              );
            }
          },
        },
      ]
    );
  };

  // PANTALLA DE CARGA
  if (cargando) {
    return (
      <View style={styles.cargandoContainer}>
        <ActivityIndicator
          size="large"
          color="#1D3D47"
        />
        <Text style={styles.textoCargando}>
          Cargando perfil...
        </Text>
      </View>
    );
  }

  // REGISTRO E INICIO DE SESIÓN
  if (!user) {
    return (
      <KeyboardAvoidingView
        style={styles.contenedorPrincipal}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.authScroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.authHeader}>
            <View style={styles.logoCirculo}>
              <Ionicons
                name="people"
                size={38}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.tituloAuth}>
              La Esperanza
            </Text>
          </View>

          <View style={styles.authCard}>
            <Text style={styles.tituloCardAuth}>
              {modoRegistro
                ? "Crear cuenta"
                : "Bienvenido de nuevo"}
            </Text>

            {/* CAMPO NOMBRE */}
            {modoRegistro && (
              <>
                <Text style={styles.labelInput}>
                  Nombre completo
                </Text>

                <View
                  style={[
                    styles.inputContenedor,
                    campoActivo === "nombre" &&
                      styles.inputContenedorActivo,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#72858A"
                  />

                  <TextInput
                    ref={nombreRef}
                    style={styles.input}
                    placeholder="Escribe tu nombre"
                    placeholderTextColor="#9AA8AB"
                    value={nombre}
                    onChangeText={setNombre}
                    autoCapitalize="words"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() =>
                      emailRef.current?.focus()
                    }
                    onFocus={() => setCampoActivo("nombre")}
                    onBlur={() => setCampoActivo(null)}
                    editable={!guardando}
                  />
                </View>
              </>
            )}

            {/* CAMPO CORREO */}
            <Text style={styles.labelInput}>
              Correo electrónico
            </Text>

            <View
              style={[
                styles.inputContenedor,
                campoActivo === "email" &&
                  styles.inputContenedorActivo,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color="#72858A"
              />

              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="ejemplo@correo.com"
                placeholderTextColor="#9AA8AB"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() =>
                  passwordRef.current?.focus()
                }
                onFocus={() => setCampoActivo("email")}
                onBlur={() => setCampoActivo(null)}
                editable={!guardando}
              />
            </View>

            {/* CAMPO CONTRASEÑA */}
            <Text style={styles.labelInput}>
              Contraseña
            </Text>

            <View
              style={[
                styles.inputContenedor,
                campoActivo === "password" &&
                  styles.inputContenedorActivo,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#72858A"
              />

              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#9AA8AB"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!mostrarPassword}
                autoCapitalize="none"
                returnKeyType={modoRegistro ? "next" : "done"}
                blurOnSubmit={!modoRegistro}
                onSubmitEditing={() => {
                  if (modoRegistro) {
                    confirmPasswordRef.current?.focus();
                  } else {
                    iniciarSesion();
                  }
                }}
                onFocus={() => setCampoActivo("password")}
                onBlur={() => setCampoActivo(null)}
                editable={!guardando}
              />

              <TouchableOpacity
                onPress={() =>
                  setMostrarPassword(!mostrarPassword)
                }
              >
                <Ionicons
                  name={
                    mostrarPassword
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={21}
                  color="#72858A"
                />
              </TouchableOpacity>
            </View>

            {/* CONFIRMAR CONTRASEÑA */}
            {modoRegistro && (
              <>
                <Text style={styles.labelInput}>
                  Confirmar contraseña
                </Text>

                <View
                  style={[
                    styles.inputContenedor,
                    campoActivo === "confirmPassword" &&
                      styles.inputContenedorActivo,
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color="#72858A"
                  />

                  <TextInput
                    ref={confirmPasswordRef}
                    style={styles.input}
                    placeholder="Repite tu contraseña"
                    placeholderTextColor="#9AA8AB"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!mostrarConfirmPassword}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={registrarUsuario}
                    onFocus={() =>
                      setCampoActivo("confirmPassword")
                    }
                    onBlur={() => setCampoActivo(null)}
                    editable={!guardando}
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setMostrarConfirmPassword(
                        !mostrarConfirmPassword
                      )
                    }
                  >
                    <Ionicons
                      name={
                        mostrarConfirmPassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={21}
                      color="#72858A"
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* BOTÓN PRINCIPAL */}
            <TouchableOpacity
              style={[
                styles.botonPrincipal,
                guardando && styles.botonDeshabilitado,
              ]}
              onPress={
                modoRegistro
                  ? registrarUsuario
                  : iniciarSesion
              }
              disabled={guardando}
              activeOpacity={0.8}
            >
              {guardando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.textoBotonPrincipal}>
                  {modoRegistro
                    ? "Crear mi cuenta"
                    : "Iniciar sesión"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.cambiarModo}>
              <Text style={styles.textoCambiarModo}>
                {modoRegistro
                  ? "¿Ya tienes una cuenta?"
                  : "¿Todavía no tienes una cuenta?"}
              </Text>

              <TouchableOpacity
                disabled={guardando}
                onPress={() => {
                  setModoRegistro(!modoRegistro);
                  setPassword("");
                  setConfirmPassword("");
                  setCampoActivo(null);
                }}
              >
                <Text style={styles.enlaceCambiarModo}>
                  {modoRegistro
                    ? "Inicia sesión"
                    : "Regístrate"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // PERFIL DEL USUARIO AUTENTICADO
  return (
    <ScrollView
      style={styles.contenedorPrincipal}
      contentContainerStyle={styles.perfilScroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.encabezadoPerfil}>
        <Text style={styles.tituloPerfil}>
          Mi perfil
        </Text>
      </View>

      <View style={styles.tarjetaUsuario}>
        <View style={styles.avatar}>
          <Ionicons
            name="person"
            size={35}
            color="#1D3D47"
          />
        </View>

        <View style={styles.datosUsuario}>
          <Text style={styles.nombreUsuario}>
            {user.nombre || "Usuario"}
          </Text>

          <Text style={styles.correoUsuario}>
            {user.email || "Sin correo registrado"}
          </Text>
        </View>
      </View>

      <View style={styles.encabezadoSeccion}>
        <Text style={styles.tituloSeccion}>
          Mi participación
        </Text>

        <TouchableOpacity
          style={styles.botonEditar}
          onPress={abrirFormulario}
          activeOpacity={0.8}
        >
          <Ionicons
            name="create-outline"
            size={17}
            color="#1D3D47"
          />
          <Text style={styles.textoBotonEditar}>
            Editar
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tarjetaInfo}>
        <View style={styles.filaInfo}>
          <View style={styles.iconoInfo}>
            <Ionicons
              name="people-outline"
              size={23}
              color="#1D3D47"
            />
          </View>

          <View style={styles.contenidoInfo}>
            <Text style={styles.etiquetaInfo}>
              Tipo de participación
            </Text>

            <Text style={styles.valorInfo}>
              {user.tipoParticipacion || "Voluntario"}
            </Text>
          </View>
        </View>

        <View style={styles.separador} />

        <View style={styles.filaInfo}>
          <View style={styles.iconoInfo}>
            <Ionicons
              name="calendar-outline"
              size={23}
              color="#1D3D47"
            />
          </View>

          <View style={styles.contenidoInfo}>
            <Text style={styles.etiquetaInfo}>
              Disponibilidad
            </Text>

            <Text style={styles.valorInfo}>
              {user.disponible === false
                ? "No disponible"
                : "Disponible para ayudar"}
            </Text>
          </View>

          <View
            style={[
              styles.puntoEstado,
              {
                backgroundColor:
                  user.disponible === false
                    ? "#B85C5C"
                    : "#4A9B76",
              },
            ]}
          />
        </View>
      </View>

      {/* FORMULARIO PARA EDITAR EL PERFIL */}
      {mostrarFormulario && (
        <View style={styles.tarjetaFormulario}>
          <Text style={styles.tituloFormulario}>
            Editar participación
          </Text>

          <Text style={styles.labelRol}>
            Tipo de participación
          </Text>

          {ROLES.map((rol) => {
            const seleccionado = tipoParticipacion === rol;

            return (
              <TouchableOpacity
                key={rol}
                style={[
                  styles.opcionRol,
                  seleccionado &&
                    styles.opcionRolSeleccionada,
                ]}
                onPress={() => setTipoParticipacion(rol)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.textoOpcionRol,
                    seleccionado &&
                      styles.textoOpcionSeleccionada,
                  ]}
                >
                  {rol}
                </Text>

                <Ionicons
                  name={
                    seleccionado
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={21}
                  color={
                    seleccionado
                      ? "#1D3D47"
                      : "#9AA8AB"
                  }
                />
              </TouchableOpacity>
            );
          })}

          <Text style={styles.labelRol}>
            ¿Estás disponible?
          </Text>

          <View style={styles.filaDisponibilidad}>
            <TouchableOpacity
              style={[
                styles.botonDisponibilidad,
                disponible && styles.disponibilidadActiva,
              ]}
              onPress={() => setDisponible(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={19}
                color={disponible ? "#FFFFFF" : "#1D3D47"}
              />

              <Text
                style={[
                  styles.textoDisponibilidad,
                  disponible &&
                    styles.textoDisponibilidadActivo,
                ]}
              >
                Sí, disponible
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.botonDisponibilidad,
                !disponible && styles.disponibilidadActiva,
              ]}
              onPress={() => setDisponible(false)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="close-circle-outline"
                size={19}
                color={!disponible ? "#FFFFFF" : "#1D3D47"}
              />

              <Text
                style={[
                  styles.textoDisponibilidad,
                  !disponible &&
                    styles.textoDisponibilidadActivo,
                ]}
              >
                No disponible
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filaBotonesFormulario}>
            <TouchableOpacity
              style={styles.botonCancelar}
              onPress={() => setMostrarFormulario(false)}
              disabled={guardando}
            >
              <Text style={styles.textoBotonCancelar}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.botonGuardar,
                guardando && styles.botonDeshabilitado,
              ]}
              onPress={guardarInformacion}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.textoBotonGuardar}>
                  Guardar
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ZONAS DE APOYO */}
      <View style={styles.encabezadoSeccion}>
        <Text style={styles.tituloSeccion}>
          Zonas de apoyo
        </Text>
      </View>

      <Text style={styles.descripcionZonas}>
        Algunos puntos de referencia de nuestra comunidad.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listaZonas}
      >
        {ZONAS.map((zona, index) => (
          <View
            style={styles.tarjetaZona}
            key={zona.nombre}
          >
            <View style={styles.iconoZona}>
              <Ionicons
                name={
                  index === 0
                    ? "shield-checkmark-outline"
                    : index === 1
                    ? "home-outline"
                    : "restaurant-outline"
                }
                size={25}
                color="#1D3D47"
              />
            </View>

            <Text style={styles.nombreZona}>
              {zona.nombre}
            </Text>

            {zona.distancia !== "" && (
              <Text style={styles.distanciaZona}>
                {zona.distancia}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      {/* CERRAR SESIÓN */}
      <TouchableOpacity
        style={styles.botonCerrarSesion}
        onPress={cerrarSesion}
        activeOpacity={0.8}
      >
        <Ionicons
          name="log-out-outline"
          size={20}
          color="#B64C4C"
        />

        <Text style={styles.textoCerrarSesion}>
          Cerrar sesión
        </Text>
      </TouchableOpacity>

      <Text style={styles.piePerfil}>
        La Esperanza · Unidos para ayudar
      </Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  contenedorPrincipal: {
    flex: 1,
    backgroundColor: "#F5F8F9",
  },

  cargandoContainer: {
    flex: 1,
    backgroundColor: "#F5F8F9",
    alignItems: "center",
    justifyContent: "center",
  },

  textoCargando: {
    marginTop: 12,
    color: "#1D3D47",
    fontSize: 14,
  },

  // Registro e inicio de sesión
  authScroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 30,
  },

  authHeader: {
    alignItems: "center",
    marginBottom: 25,
  },

  logoCirculo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#1D3D47",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  tituloAuth: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1D3D47",
  },

  authCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: "#000000",
  },

  tituloCardAuth: {
    textAlign: "center",
    fontSize: 23,
    fontWeight: "800",
    color: "#1D3D47",
  },

  labelInput: {
    color: "#1D3D47",
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 8,
    marginTop: 12,
  },

  inputContenedor: {
    minHeight: 51,
    borderWidth: 1,
    borderColor: "#DCE6E8",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    backgroundColor: "#FBFDFD",
  },

  // Borde resaltado del campo seleccionado
  inputContenedorActivo: {
    borderColor: "#1D3D47",
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
  },

  input: {
    flex: 1,
    color: "#243E44",
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },

  botonPrincipal: {
    backgroundColor: "#1D3D47",
    minHeight: 51,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },

  botonDeshabilitado: {
    opacity: 0.65,
  },

  textoBotonPrincipal: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  cambiarModo: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 5,
  },

  textoCambiarModo: {
    color: "#000000",
    fontSize: 13,
  },

  enlaceCambiarModo: {
    color: "#1D3D47",
    fontSize: 13,
    fontWeight: "800",
  },

  // Perfil
  perfilScroll: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 30,
  },

  encabezadoPerfil: {
    marginBottom: 22,
  },

  tituloPerfil: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1D3D47",
  },

  tarjetaUsuario: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5ECEE",
    marginBottom: 25,
  },

  avatar: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "#DCECEF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  datosUsuario: {
    flex: 1,
  },

  nombreUsuario: {
    color: "#1D3D47",
    fontSize: 18,
    fontWeight: "800",
  },

  correoUsuario: {
    color: "#72858A",
    fontSize: 13,
    marginTop: 5,
  },

  encabezadoSeccion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  tituloSeccion: {
    color: "#1D3D47",
    fontSize: 19,
    fontWeight: "800",
  },

  botonEditar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCECEF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
  },

  textoBotonEditar: {
    color: "#1D3D47",
    fontSize: 13,
    fontWeight: "700",
  },

  tarjetaInfo: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5ECEE",
    marginBottom: 26,
  },

  filaInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },

  iconoInfo: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#EAF3F4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  contenidoInfo: {
    flex: 1,
  },

  etiquetaInfo: {
    color: "#72858A",
    fontSize: 12,
  },

  valorInfo: {
    color: "#1D3D47",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 5,
  },

  separador: {
    height: 1,
    backgroundColor: "#EDF1F2",
  },

  puntoEstado: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },

  // Formulario de edición
  tarjetaFormulario: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: "#DCE6E8",
    marginBottom: 26,
  },

  tituloFormulario: {
    fontSize: 19,
    color: "#1D3D47",
    fontWeight: "800",
  },

  labelRol: {
    color: "#1D3D47",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 5,
  },

  opcionRol: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#E2EAEC",
    borderRadius: 11,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },

  opcionRolSeleccionada: {
    borderColor: "#1D3D47",
    backgroundColor: "#EDF5F6",
  },

  textoOpcionRol: {
    fontSize: 13,
    color: "#536B71",
  },

  textoOpcionSeleccionada: {
    color: "#1D3D47",
    fontWeight: "700",
  },

  filaDisponibilidad: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },

  botonDisponibilidad: {
    flex: 1,
    minHeight: 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#DCE6E8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    gap: 5,
  },

  disponibilidadActiva: {
    backgroundColor: "#1D3D47",
    borderColor: "#1D3D47",
  },

  textoDisponibilidad: {
    color: "#1D3D47",
    fontSize: 11,
    fontWeight: "700",
  },

  textoDisponibilidadActivo: {
    color: "#FFFFFF",
  },

  filaBotonesFormulario: {
    flexDirection: "row",
    gap: 10,
    marginTop: 5,
  },

  botonCancelar: {
    flex: 1,
    minHeight: 47,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#DCE6E8",
    alignItems: "center",
    justifyContent: "center",
  },

  textoBotonCancelar: {
    color: "#536B71",
    fontWeight: "700",
  },

  botonGuardar: {
    flex: 1,
    minHeight: 47,
    borderRadius: 11,
    backgroundColor: "#1D3D47",
    alignItems: "center",
    justifyContent: "center",
  },

  textoBotonGuardar: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // Zonas
  descripcionZonas: {
    color: "#72858A",
    fontSize: 13,
    marginTop: -5,
    marginBottom: 14,
    lineHeight: 19,
  },

  listaZonas: {
    paddingBottom: 8,
    gap: 12,
  },

  tarjetaZona: {
    width: 165,
    minHeight: 145,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5ECEE",
  },

  iconoZona: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#DCECEF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  nombreZona: {
    color: "#1D3D47",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },

  distanciaZona: {
    color: "#72858A",
    fontSize: 12,
    marginTop: 6,
  },

  botonCerrarSesion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0DCDC",
    minHeight: 48,
    borderRadius: 12,
    marginTop: 28,
    gap: 8,
  },

  textoCerrarSesion: {
    color: "#B64C4C",
    fontSize: 14,
    fontWeight: "700",
  },

  piePerfil: {
    textAlign: "center",
    color: "#8A9A9E",
    fontSize: 12,
    marginTop: 20,
  },
});