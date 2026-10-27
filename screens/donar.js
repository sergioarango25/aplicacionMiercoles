import React, { useEffect, useState } from 'react';
import LogoD1 from '../assets/img/Logo-d1.svg';
import LogoAra from '../assets/img/Logo-ara.svg';
import LogoExito from '../assets/img/Logo-exito.svg';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';

const Donar = () => {
  const [donationType, setDonationType] = useState('monetary');
  const [selectedAmount, setSelectedAmount] = useState('50000');
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [note, setNote] = useState('');

  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Montos disponibles
  const amounts = [
    { value: '20000', label: '$20.000' },
    { value: '50000', label: '$50.000' },
    { value: '100000', label: '$100.000' },
    { value: '200000', label: '$200.000' },
  ];

  // Detectar el usuario autenticado
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser && !donorName.trim()) {
        setDonorName(currentUser.displayName || '');
      }
    });

    return unsubscribeAuth;
  }, []);

  // Cargar únicamente las donaciones del usuario
  useEffect(() => {
    if (!user) {
      setDonations([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    const donationsQuery = query(
      collection(db, 'donaciones'),
      where('usuarioId', '==', user.uid),
      orderBy('fecha', 'desc')
    );

    const unsubscribe = onSnapshot(
      donationsQuery,
      (snapshot) => {
        const donationsData = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setDonations(donationsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error al cargar donaciones:', error);
        setLoading(false);

        Alert.alert(
          'No se pudo cargar el historial',
          'Revisa tu conexión y los permisos de Firestore.'
        );
      }
    );

    return unsubscribe;
  }, [user]);

  // Obtener el monto seleccionado
  const getCurrentDonationValue = () => {
    const rawValue =
      selectedAmount === 'custom'
        ? customAmount
        : selectedAmount;

    const normalizedValue = String(rawValue).replace(/[.\s,$]/g, '');

    if (!/^\d+$/.test(normalizedValue)) {
      return 0;
    }

    return Number(normalizedValue);
  };

  // Seleccionar uno de los montos
  const handleSelectAmount = (value) => {
    setSelectedAmount(value);
    setCustomAmount('');
  };

  // Aceptar únicamente números en el monto personalizado
  const handleCustomAmountChange = (text) => {
    const digitsOnly = text.replace(/\D/g, '');

    setCustomAmount(digitsOnly);
    setSelectedAmount('custom');
  };

  // Validar y guardar la donación
  const handleSaveDonation = async () => {
    if (!user) {
      Alert.alert(
        'Inicia sesión',
        'Debes iniciar sesión para guardar tu donación.'
      );
      return;
    }

    const amount = getCurrentDonationValue();
    const cleanName = donorName.trim();
    const cleanNote = note.trim();

    if (!cleanName) {
      Alert.alert(
        'Falta tu nombre',
        'Escribe el nombre del donante.'
      );
      return;
    }

    if (!Number.isSafeInteger(amount) || amount < 1000) {
      Alert.alert(
        'Monto inválido',
        'Ingresa un monto de mínimo $1.000 COP, sin puntos ni comas.'
      );
      return;
    }

    if (cleanNote.length > 250) {
      Alert.alert(
        'Mensaje muy largo',
        'El mensaje debe tener máximo 250 caracteres.'
      );
      return;
    }

    // Confirmar antes de guardar
    Alert.alert(
      'Confirmar donación',
      `Vas a registrar una donación de $${amount.toLocaleString(
        'es-CO'
      )} COP. Este formulario guarda el registro, pero no realiza un pago real.`,
      [
        {
          text: 'Revisar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setSaving(true);

              await addDoc(collection(db, 'donaciones'), {
                usuarioId: user.uid,
                nombreDonante: cleanName,
                correo: user.email || '',
                monto: amount,
                moneda: 'COP',
                nota: cleanNote,
                estado: 'Registrada',
                fecha: serverTimestamp(),
              });

              setCustomAmount('');
              setSelectedAmount('50000');
              setNote('');

              Alert.alert(
                'Registro guardado',
                'Tu donación quedó guardada en Firebase y aparecerá en tu historial.'
              );
            } catch (error) {
              console.error('Error al guardar donación:', error);

              Alert.alert(
                'No se pudo guardar',
                'Verifica tu conexión, que hayas iniciado sesión y las reglas de Firestore.'
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  // Formatear la fecha
  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) {
      return 'Fecha pendiente';
    }

    return timestamp.toDate().toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Resumen de donaciones */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>
          MIS DONACIONES
        </Text>

        <Text style={styles.heroValue}>
          {donations
            .reduce(
              (total, item) =>
                total + (Number(item.monto) || 0),
              0
            )
            .toLocaleString('es-CO', {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0,
            })}
        </Text>

        <Text style={styles.heroHint}>
          Total de donaciones registradas en tu cuenta
        </Text>
      </View>

      {/* Tarjeta principal */}
      <View style={styles.donationCard}>
        {/* Selector de tipo */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              donationType === 'monetary' &&
                styles.toggleActive,
            ]}
            onPress={() => setDonationType('monetary')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                donationType === 'monetary' &&
                  styles.toggleTextActive,
              ]}
            >
              Dinero
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              donationType === 'inkind' &&
                styles.toggleActive,
            ]}
            onPress={() => setDonationType('inkind')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                donationType === 'inkind' &&
                  styles.toggleTextActive,
              ]}
            >
              Insumos
            </Text>
          </TouchableOpacity>
        </View>

        {donationType === 'monetary' ? (
          <>
            <Text style={styles.sectionTitle}>
              Registrar donación
            </Text>

            <Text style={styles.helperText}>
              Elige un monto o escribe otro valor en pesos colombianos.
            </Text>

            {/* Montos predefinidos */}
            <View style={styles.gridAmounts}>
              {amounts.map((item) => {
                const selected =
                  selectedAmount === item.value;

                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.amountCard,
                      selected &&
                        styles.amountCardSelected,
                    ]}
                    onPress={() =>
                      handleSelectAmount(item.value)
                    }
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.amountText,
                        selected &&
                          styles.amountTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Monto personalizado */}
            <Text style={styles.label}>
              Otro monto (COP)
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ej. 30000"
              placeholderTextColor="#94a3b8"
              value={customAmount}
              onChangeText={handleCustomAmountChange}
              onFocus={() => setSelectedAmount('custom')}
              keyboardType="number-pad"
              maxLength={12}
              returnKeyType="done"
            />

            {/* Nombre del donante */}
            <Text style={styles.label}>
              Nombre del donante *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Escribe tu nombre"
              placeholderTextColor="#94a3b8"
              value={donorName}
              onChangeText={setDonorName}
              autoCapitalize="words"
              maxLength={80}
              returnKeyType="next"
            />

            {/* Mensaje opcional */}
            <Text style={styles.label}>
              Mensaje (opcional)
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.noteInput,
              ]}
              placeholder="¿Quieres dejar una nota? (máx. 250 caracteres)"
              placeholderTextColor="#94a3b8"
              value={note}
              onChangeText={setNote}
              maxLength={250}
              multiline
            />

            <Text style={styles.disclaimer}>
              Este formulario registra tu intención de donar.
              No procesa pagos ni solicita datos bancarios.
            </Text>

            {/* Botón de guardar */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                saving && styles.buttonDisabled,
              ]}
              onPress={handleSaveDonation}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  Guardar donación
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.supermercadoContainer}>
            <Text style={styles.helperText}>
              Consulta estos comercios para encontrar productos
              de primera necesidad que puedas donar.
            </Text>
          </View>
        )}
      </View>

      {/* Comercios para donaciones de insumos */}
      {donationType === 'inkind' && (
        <View style={styles.infoContainer}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>
              Tiendas D1
            </Text>

            <LogoD1 width={70} height={70} />

            <TouchableOpacity
              onPress={() =>
                Linking.openURL('https://www.d1.com.co/')
              }
            >
              <Text style={styles.linkText}>
                Visitar D1
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>
              Tiendas Ara
            </Text>

            <LogoAra width={70} height={70} />

            <TouchableOpacity
              onPress={() =>
                Linking.openURL('https://www.tiendasara.com/')
              }
            >
              <Text style={styles.linkText}>
                Visitar Ara
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>
              Supermercados Éxito
            </Text>

            <LogoExito width={70} height={70} />

            <TouchableOpacity
              onPress={() =>
                Linking.openURL('https://www.exito.com/')
              }
            >
              <Text style={styles.linkText}>
                Visitar Éxito
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Historial personal */}
      {donationType === 'monetary' && (
        <View style={styles.historyCard}>
          <Text style={styles.sectionTitle}>
            Mi historial
          </Text>

          {!user ? (
            <Text style={styles.emptyText}>
              Inicia sesión para guardar y consultar tus donaciones.
            </Text>
          ) : loading ? (
            <ActivityIndicator color="#1d64b4" />
          ) : donations.length === 0 ? (
            <Text style={styles.emptyText}>
              Todavía no tienes donaciones registradas.
            </Text>
          ) : (
            donations.map((item) => (
              <View
                key={item.id}
                style={styles.historyItem}
              >
                <View style={styles.historyInfo}>
                  <Text style={styles.historyAmount}>
                    $
                    {(Number(item.monto) || 0).toLocaleString(
                      'es-CO'
                    )}{' '}
                    COP
                  </Text>

                  <Text style={styles.historyDate}>
                    {formatDate(item.fecha)}
                  </Text>

                  {!!item.nota && (
                    <Text style={styles.historyNote}>
                      {item.nota}
                    </Text>
                  )}
                </View>

                <Text style={styles.historyStatus}>
                  {item.estado || 'Registrada'}
                </Text>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  container: {
    padding: 16,
    paddingBottom: 32,
  },

  heroCard: {
    backgroundColor: '#002244',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },

  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#cbd5e1',
    marginBottom: 8,
  },

  heroValue: {
    fontSize: 27,
    fontWeight: '800',
    color: '#ffffff',
  },

  heroHint: {
    color: '#dbeafe',
    fontSize: 12,
    marginTop: 6,
  },

  donationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  toggleContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    marginBottom: 18,
  },

  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  toggleActive: {
    backgroundColor: '#ffffff',
  },

  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },

  toggleTextActive: {
    color: '#0f172a',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },

  helperText: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },

  gridAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  amountCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginBottom: 10,
  },

  amountCardSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#1d64b4',
  },

  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },

  amountTextSelected: {
    color: '#1d64b4',
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 8,
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },

  noteInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },

  disclaimer: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
    marginBottom: 14,
  },

  submitButton: {
    width: '100%',
    paddingVertical: 14,
    backgroundColor: '#1d64b4',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  supermercadoContainer: {
    paddingVertical: 10,
  },

  infoContainer: {
    marginTop: 16,
    gap: 14,
  },

  infoBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'flex-start',
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D3D47',
    marginBottom: 10,
  },

  linkText: {
    marginTop: 10,
    fontSize: 14,
    color: '#1d4ed8',
    textDecorationLine: 'underline',
  },

  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  emptyText: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
  },

  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 10,
  },

  historyInfo: {
    flex: 1,
  },

  historyAmount: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },

  historyDate: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },

  historyNote: {
    color: '#475569',
    fontSize: 12,
    marginTop: 4,
  },

  historyStatus: {
    color: '#1d64b4',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default Donar;