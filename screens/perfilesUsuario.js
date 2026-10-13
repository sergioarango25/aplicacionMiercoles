import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

import { auth, db } from '../firebaseConfig.js';


export default function PerfilUsuario() {

  const [user, setUser] = useState(null);

  const [cargando, setCargando] = useState(true);

  // Controla si mostramos el formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Datos que se van a editar
  const [tipoParticipacion, setTipoParticipacion] = useState('');
  const [disponible, setDisponible] = useState(true);

  const [guardando, setGuardando] = useState(false);


  // Opciones de participación
  const tiposParticipacion = [
    'Voluntario',
    'Apoyo comunitario',
    'Logística',
    'Comunicación',
    'Apoyo en suministros',
  ];


  const [zonas] = useState([
    {
      nombre: 'Zona segura',
      distancia: '',
    },
    {
      nombre: 'Refugio San Miguel',
      distancia: '1.2 km',
    },
    {
      nombre: 'Punto de alimentación',
      distancia: '1.5 km',
    },
  ]);


  // Obtener usuario de Firebase
  useEffect(() => {

    const obtenerUsuario = async () => {

      try {

        const usuarioActual = auth.currentUser;

        if (!usuarioActual) {

          Alert.alert(
            'Sesión no encontrada',
            'No hay un usuario actualmente conectado.'
          );

          setCargando(false);

          return;
        }


        console.log(
          'Usuario autenticado:',
          usuarioActual.uid
        );


        const referenciaUsuario = doc(
          db,
          'usuarios',
          usuarioActual.uid
        );


        const documentoUsuario = await getDoc(
          referenciaUsuario
        );


        if (documentoUsuario.exists()) {

          const datos = documentoUsuario.data();

          console.log(
            'Datos del usuario:',
            datos
          );


          setUser(datos);


          // Cargar información del formulario
          setTipoParticipacion(
            datos.tipoParticipacion || 'Voluntario'
          );


          setDisponible(
            datos.disponible !== undefined
              ? datos.disponible
              : true
          );


        } else {

          Alert.alert(
            'Información',
            'No se encontró información adicional de tu perfil.'
          );

        }


      } catch (error) {

        console.log(
          'Error obteniendo usuario:',
          error
        );


        Alert.alert(
          'Error',
          'No se pudo obtener la información del usuario.'
        );


      } finally {

        setCargando(false);

      }

    };


    obtenerUsuario();

  }, []);


  // Abrir formulario
  const abrirFormulario = () => {

    setTipoParticipacion(
      user.tipoParticipacion || 'Voluntario'
    );

    setDisponible(
      user.disponible !== undefined
        ? user.disponible
        : true
    );

    setMostrarFormulario(true);

  };


  // Guardar cambios
  const guardarInformacion = async () => {

    try {

      setGuardando(true);

      const usuarioActual = auth.currentUser;


      if (!usuarioActual) {

        Alert.alert(
          'Error',
          'No hay una sesión activa.'
        );

        return;

      }


      const referenciaUsuario = doc(
        db,
        'usuarios',
        usuarioActual.uid
      );


      // Actualizar Firestore
      await updateDoc(
        referenciaUsuario,
        {
          tipoParticipacion: tipoParticipacion,
          disponible: disponible,
        }
      );


      // Actualizar la información mostrada
      setUser({
        ...user,
        tipoParticipacion: tipoParticipacion,
        disponible: disponible,
      });


      setMostrarFormulario(false);


      Alert.alert(
        'Información actualizada',
        'Tu información de participación fue guardada correctamente.'
      );


    } catch (error) {

      console.log(
        'Error actualizando perfil:',
        error
      );


      Alert.alert(
        'Error',
        'No se pudo actualizar la información.'
      );


    } finally {

      setGuardando(false);

    }

  };


  // Pantalla de carga
  if (cargando) {

    return (

      <View style={styles.loadingContainer}>

        <ActivityIndicator
          size="large"
          color="#1D3D47"
        />

        <Text style={styles.loadingText}>
          Cargando perfil...
        </Text>

      </View>

    );

  }


  // Sin usuario
  if (!user) {

    return (

      <View style={styles.loadingContainer}>

        <Ionicons
          name="person-circle-outline"
          size={70}
          color="#1D3D47"
        />

        <Text style={styles.loadingText}>
          No se encontró información del perfil.
        </Text>

      </View>

    );

  }


  return (

    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >


      {/* Tarjeta del usuario */}

      <View style={styles.userCard}>

        <Ionicons
          name="person-circle"
          size={58}
          color="#1D3D47"
        />


        <View style={styles.userInfo}>

          <Text style={styles.userNombre}>
            {user.nombre}
          </Text>

          <Text style={styles.userSub}>
            {user.email}
          </Text>

        </View>

      </View>


      {/* Rol comunitario */}

      <Text style={styles.seccion}>
        Mi rol comunitario
      </Text>


      <View style={styles.rolCard}>

        <Ionicons
          name="shield-checkmark"
          size={28}
          color="#2E8B57"
        />


        <View style={{ marginLeft: 12 }}>

          <Text style={styles.userSub}>
            Ayudas a hacer de La Esperanza un lugar más seguro
          </Text>

        </View>

      </View>


      {/* Información de voluntariado */}

      <View style={styles.tituloSeccionContainer}>

        <Text style={styles.seccion}>
          Información de voluntariado
        </Text>


        <TouchableOpacity
          style={styles.botonEditar}
          onPress={abrirFormulario}
        >

          <Ionicons
            name="create-outline"
            size={18}
            color="#1D3D47"
          />

          <Text style={styles.textoEditar}>
            Editar
          </Text>

        </TouchableOpacity>

      </View>


      <View style={styles.infoCard}>


        {/* Tipo de participación */}

        <View style={styles.infoRow}>

          <Ionicons
            name="people-outline"
            size={22}
            color="#1D3D47"
          />


          <View style={styles.infoTextContainer}>

            <Text style={styles.infoTitle}>
              Tipo de participación
            </Text>


            <Text style={styles.infoValue}>
              {user.tipoParticipacion || 'Voluntario'}
            </Text>

          </View>

        </View>


        {/* Disponibilidad */}

        <View style={styles.infoRow}>

          <Ionicons
            name="radio-outline"
            size={22}
            color={
              user.disponible
                ? '#2E8B57'
                : '#D32F2F'
            }
          />


          <View style={styles.infoTextContainer}>

            <Text style={styles.infoTitle}>
              Disponibilidad
            </Text>


            <Text
              style={[
                styles.infoValue,
                {
                  color: user.disponible
                    ? '#2E8B57'
                    : '#D32F2F',
                },
              ]}
            >

              {user.disponible
                ? 'Disponible para ayudar'
                : 'No disponible'}

            </Text>

          </View>

        </View>

      </View>


      {/* FORMULARIO */}

      {mostrarFormulario && (

        <View style={styles.formulario}>

          <Text style={styles.formularioTitulo}>
            Editar información
          </Text>


          <Text style={styles.formularioLabel}>
            Tipo de participación
          </Text>


          <View style={styles.opcionesContainer}>

            {tiposParticipacion.map((tipo) => {

              const seleccionado =
                tipoParticipacion === tipo;


              return (

                <TouchableOpacity
                  key={tipo}
                  style={[
                    styles.opcion,
                    seleccionado &&
                      styles.opcionSeleccionada,
                  ]}
                  onPress={() =>
                    setTipoParticipacion(tipo)
                  }
                >

                  <Ionicons
                    name={
                      seleccionado
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={20}
                    color={
                      seleccionado
                        ? '#1D3D47'
                        : '#777'
                    }
                  />


                  <Text
                    style={[
                      styles.opcionTexto,
                      seleccionado &&
                        styles.opcionTextoSeleccionado,
                    ]}
                  >
                    {tipo}
                  </Text>

                </TouchableOpacity>

              );

            })}

          </View>


          {/* Disponibilidad */}

          <Text style={styles.formularioLabel}>
            Disponibilidad
          </Text>


          <View style={styles.disponibilidadContainer}>


            <TouchableOpacity
              style={[
                styles.disponibilidadBoton,
                disponible &&
                  styles.disponibleSeleccionado,
              ]}
              onPress={() => setDisponible(true)}
            >

              <Ionicons
                name="checkmark-circle"
                size={22}
                color={
                  disponible
                    ? '#2E8B57'
                    : '#777'
                }
              />


              <Text
                style={[
                  styles.disponibilidadTexto,
                  disponible &&
                    styles.disponibleTexto,
                ]}
              >
                Disponible
              </Text>

            </TouchableOpacity>


            <TouchableOpacity
              style={[
                styles.disponibilidadBoton,
                !disponible &&
                  styles.noDisponibleSeleccionado,
              ]}
              onPress={() => setDisponible(false)}
            >

              <Ionicons
                name="close-circle"
                size={22}
                color={
                  !disponible
                    ? '#D32F2F'
                    : '#777'
                }
              />


              <Text
                style={[
                  styles.disponibilidadTexto,
                  !disponible &&
                    styles.noDisponibleTexto,
                ]}
              >
                No disponible
              </Text>

            </TouchableOpacity>

          </View>


          {/* Botones */}

          <View style={styles.botonesFormulario}>

            <TouchableOpacity
              style={styles.botonCancelar}
              onPress={() =>
                setMostrarFormulario(false)
              }
              disabled={guardando}
            >

              <Text style={styles.textoCancelar}>
                Cancelar
              </Text>

            </TouchableOpacity>


            <TouchableOpacity
              style={styles.botonGuardar}
              onPress={guardarInformacion}
              disabled={guardando}
            >

              {guardando ? (

                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

              ) : (

                <Text style={styles.textoGuardar}>
                  Guardar cambios
                </Text>

              )}

            </TouchableOpacity>

          </View>

        </View>

      )}


      {/* Zonas */}

      <Text style={styles.seccion}>
        Zonas de alto flujo de personas
      </Text>


      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >

        {zonas.map((zona, i) => (

          <View
            key={i}
            style={styles.zonaCard}
          >

            <Ionicons
              name="location"
              size={20}
              color="#1D3D47"
            />


            <Text style={styles.zonaNombre}>
              {zona.nombre}
            </Text>


            {zona.distancia ? (

              <Text style={styles.userSub}>
                {zona.distancia}
              </Text>

            ) : null}

          </View>

        ))}

      </ScrollView>

    </ScrollView>

  );

}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
  },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF2F8',
    borderRadius: 15,
    padding: 15,
  },

  userInfo: {
    marginLeft: 12,
    flex: 1,
  },

  userNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },

  userSub: {
    fontSize: 12,
    color: '#555',
    marginTop: 5,
  },

  seccion: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
    color: '#1D3D47',
  },

  tituloSeccionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  botonEditar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },

  textoEditar: {
    marginLeft: 4,
    color: '#1D3D47',
    fontSize: 13,
    fontWeight: '600',
  },

  rolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    borderRadius: 15,
    padding: 20,
  },

  infoCard: {
    backgroundColor: '#F8FAFA',
    borderRadius: 15,
    padding: 20,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  infoTextContainer: {
    marginLeft: 12,
  },

  infoTitle: {
    fontSize: 12,
    color: '#777',
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D3D47',
    marginTop: 2,
  },

  formulario: {
    backgroundColor: '#F8FAFA',
    borderRadius: 15,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },

  formularioTitulo: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1D3D47',
    marginBottom: 15,
  },

  formularioLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D3D47',
    marginBottom: 8,
    marginTop: 5,
  },

  opcionesContainer: {
    marginBottom: 15,
  },

  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    marginBottom: 8,
  },

  opcionSeleccionada: {
    borderColor: '#1D3D47',
    backgroundColor: '#EAF2F8',
  },

  opcionTexto: {
    marginLeft: 10,
    fontSize: 14,
    color: '#555',
  },

  opcionTextoSeleccionado: {
    color: '#1D3D47',
    fontWeight: '600',
  },

  disponibilidadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  disponibilidadBoton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },

  disponibleSeleccionado: {
    borderColor: '#2E8B57',
    backgroundColor: '#F0FFF4',
  },

  noDisponibleSeleccionado: {
    borderColor: '#D32F2F',
    backgroundColor: '#FFF5F5',
  },

  disponibilidadTexto: {
    marginLeft: 6,
    fontSize: 13,
    color: '#777',
    fontWeight: '600',
  },

  disponibleTexto: {
    color: '#2E8B57',
  },

  noDisponibleTexto: {
    color: '#D32F2F',
  },

  botonesFormulario: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  botonCancelar: {
    width: '35%',
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },

  textoCancelar: {
    color: '#555',
    fontWeight: '600',
  },

  botonGuardar: {
    width: '60%',
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#1D3D47',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoGuardar: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  zonaCard: {
    width: 110,
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 15,
    alignItems: 'center',
  },

  zonaNombre: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },

});

