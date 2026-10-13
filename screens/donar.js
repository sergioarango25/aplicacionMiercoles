
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';

const Donar = () => {

  const [totalLivesReached, setTotalLivesReached] = useState(0);

  // Tipo de donación
  const [donationType, setDonationType] = useState('monetary');

  // Monto seleccionado
  const [selectedAmount, setSelectedAmount] = useState('50000');
  const [customAmount, setCustomAmount] = useState('');

  // Mensaje de confirmación
  const [successMessage, setSuccessMessage] = useState('');

  // Montos disponibles
  const amounts = [
    { value: '20000', label: '$20.000', popular: false },
    { value: '50000', label: '$50.000', popular: true },
    { value: '100000', label: '$100.000', popular: false },
    { value: '200000', label: '$200.000', popular: false },
  ];

  // Seleccionar monto
  const handleSelectAmount = (val) => {
    setSelectedAmount(val);
    setCustomAmount('');
  };

  // Escribir monto personalizado
  const handleCustomAmountChange = (text) => {
    if (/^\d*$/.test(text)) {
      setCustomAmount(text);
      setSelectedAmount('custom');
    }
  };

  // Obtener valor actual
  const getCurrentDonationValue = () => {
    if (selectedAmount === 'custom') {
      return parseInt(customAmount, 10) || 0;
    }

    return parseInt(selectedAmount, 10) || 0;
  };

  // Completar donación
  const handleCompleteDonation = () => {
    const donationValue = getCurrentDonationValue();

    if (donationValue <= 0) {
      Alert.alert(
        'Monto inválido',
        'Por favor ingresa o selecciona un monto válido para donar.'
      );
      return;
    }

    setTotalLivesReached((prevTotal) => prevTotal + donationValue);

    const formattedAmount = donationValue.toLocaleString('es-CO');

    setSuccessMessage(
      `¡Gracias! Has donado $${formattedAmount} COP exitosamente.`
    );

    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);

    setCustomAmount('');
    setSelectedAmount('50000');
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >

      {successMessage !== '' && (
        <View style={styles.toastNotification}>
          <Text style={styles.toastText}>
            {successMessage}
          </Text>
        </View>
      )}


      {/* Tarjeta de métricas */}
      <View style={styles.heroCard}>

        <View style={styles.heroContent}>

          <Text style={styles.heroLabel}>
            TOTAL LIVES REACHED
          </Text>

          <Text style={styles.heroValue}>
            {totalLivesReached.toLocaleString('en-US')}
          </Text>



          </View>

        </View>
      {/* Tarjeta de donación */}
      <View style={styles.donationCard}>

        {/* Selector de tipo */}
        <View style={styles.toggleContainer}>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              donationType === 'monetary' && styles.toggleActive,
            ]}
            onPress={() => setDonationType('monetary')}
          >
            <Text
              style={[
                styles.toggleText,
                donationType === 'monetary' && styles.toggleTextActive,
              ]}
            >
              💲 Monto
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              donationType === 'inkind' && styles.toggleActive,
            ]}
            onPress={() => setDonationType('inkind')}
          >
            <Text
              style={[
                styles.toggleText,
                donationType === 'inkind' && styles.toggleTextActive,
              ]}
            >
              📦 Insumos
            </Text>
          </TouchableOpacity>

        </View>

        {/* DONACIÓN MONETARIA */}
        {donationType === 'monetary' ? (
          <>

            <Text style={styles.sectionTitle}>
              selecciona un monto para donar (COP)
            </Text>

            {/* Montos */}
            <View style={styles.gridAmounts}>

              {amounts.map((item) => {

                const isSelected =
                  selectedAmount === item.value;

                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.amountCard,
                      isSelected && styles.amountCardSelected,
                    ]}
                    onPress={() =>
                      handleSelectAmount(item.value)
                    }
                  >

                    {item.popular && (
                      <View style={styles.popularTag}>
                        <Text style={styles.popularText}>
                          POPULAR
                        </Text>
                      </View>
                    )}

                    <Text
                      style={[
                        styles.amountText,
                        isSelected &&
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
            <View style={styles.customAmountContainer}>

              <View
                style={[
                  styles.inputWrapper,
                  selectedAmount === 'custom' &&
                    styles.inputWrapperSelected,
                ]}
              >

                <Text style={styles.currencySymbol}>
                  $
                </Text>

                <TextInput
                  placeholder="Otra cantidad"
                  placeholderTextColor="#94a3b8"
                  value={customAmount}
                  onChangeText={handleCustomAmountChange}
                  onFocus={() =>
                    setSelectedAmount('custom')
                  }
                  keyboardType="numeric"
                  style={styles.customInput}
                />

              </View>

            </View>

            {/* Botón */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCompleteDonation}
            >
              <Text style={styles.submitButtonText}>
                Completar Donación ➔
              </Text>
            </TouchableOpacity>

          </>
        ) : (

          /* DONACIÓN DE INSUMOS */
          <View style={styles.inkindContainer}>

            <Text style={styles.inkindText}>
              Gracias por tu interés en donar insumos físicos.
              Por favor ponte en contacto con nuestro equipo local.
              Llama al número: +57 123 456 789 o envía un correo a: info@organizacion.org
            </Text>

          </View>

        )}

      </View>

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
    paddingBottom: 30,
  },

  /* Mensaje de éxito */
  toastNotification: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  toastText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* Encabezado */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  iconButton: {
    padding: 5,
  },

  iconText: {
    fontSize: 18,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },

  /* Tarjeta principal */
  heroCard: {
    backgroundColor: '#002244',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },

  heroContent: {
    flex: 1,
  },

  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#94a3b8',
    marginBottom: 4,
  },

  heroValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },

  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },

  badgeIcon: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 6,
  },

  badgeText: {
    fontSize: 11,
    color: '#ffffff',
  },

  globeIcon: {
    fontSize: 48,
    opacity: 0.15,
  },

  /* Tarjeta de donación */
  donationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },

  /* Selector */
  toggleContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    marginBottom: 20,
  },

  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },

  toggleActive: {
    backgroundColor: '#ffffff',
  },

  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },

  toggleTextActive: {
    color: '#0f172a',
  },

  /* Título */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 14,
  },

  /* Montos */
  gridAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  amountCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginBottom: 12,
    position: 'relative',
  },

  amountCardSelected: {
    backgroundColor: '#e0e7ff',
    borderColor: '#1d4ed8',
  },

  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },

  amountTextSelected: {
    color: '#1d4ed8',
  },

  /* Popular */
  popularTag: {
    position: 'absolute',
    top: -8,
    right: -4,
    backgroundColor: '#1e64b4',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },

  popularText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* Monto personalizado */
  customAmountContainer: {
    marginBottom: 20,
  },

  customLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '500',
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },

  inputWrapperSelected: {
    borderColor: '#1d4ed8',
    backgroundColor: '#eff6ff',
  },

  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginRight: 8,
  },

  customInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },

  /* Botón */
  submitButton: {
    width: '100%',
    paddingVertical: 14,
    backgroundColor: '#1d64b4',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Insumos */
  inkindContainer: {
    paddingVertical: 20,
  },

  inkindText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },

});

export default Donar;

