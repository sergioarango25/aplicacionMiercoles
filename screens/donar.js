import React, { useState } from 'react';
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
      {/* Mensaje de éxito */}
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

      {/* Tarjeta principal de donación */}
      <View style={styles.donationCard}>

        {/* Selector de tipo */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              donationType === 'monetary' && styles.toggleActive,
            ]}
            onPress={() => setDonationType('monetary')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleText,
                donationType === 'monetary' &&
                  styles.toggleTextActive,
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
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleText,
                donationType === 'inkind' &&
                  styles.toggleTextActive,
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
              Selecciona un monto para donar (COP)
            </Text>

            {/* Montos disponibles */}
            <View style={styles.gridAmounts}>
              {amounts.map((item) => {
                const isSelected = selectedAmount === item.value;

                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.amountCard,
                      isSelected && styles.amountCardSelected,
                    ]}
                    onPress={() => handleSelectAmount(item.value)}
                    activeOpacity={0.7}
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
                        isSelected && styles.amountTextSelected,
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
                  onFocus={() => setSelectedAmount('custom')}
                  keyboardType="numeric"
                  style={styles.customInput}
                />
              </View>
            </View>

            {/* Botón para completar donación */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCompleteDonation}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>
                Completar Donación
              </Text>
            </TouchableOpacity>
            
          </>

          
        ) : (
          
          /* DONACIÓN DE INSUMOS */
          <View style={styles.supermercadoContainer}>
            <Text style={styles.supermercadoText}>
              En este apartado podras encontrar los supermercados y tiendas de conveniencia para que puedas verificar productos de primera necesidad que puedes donar a las personas afectadas por la emergencia.
            </Text>
          </View>
        )}
      </View>

      {/* TARJETAS INFORMATIVAS FUERA DE LA TARJETA PRINCIPAL */}
      {donationType === 'inkind' && (
        <View style={styles.infoContainer}>

          {/* Caja de contacto */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Tiendas D1</Text>

            <LogoD1 width={70} height={70} />

            <TouchableOpacity
              onPress={() => Linking.openURL('https://www.d1.com.co/')}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>
                https://www.d1.com.co/
              </Text>
            </TouchableOpacity>
          </View>

          {/* Caja de puntos de entrega */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>
              Tiendas Ara
            </Text>

            <LogoAra width={70} height={70} />

            <TouchableOpacity
              onPress={() => Linking.openURL('https://www.tiendasara.com/')}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>
                https://www.tiendasara.com/
              </Text>
            </TouchableOpacity>
          </View>

          {/* Caja de insumos necesarios */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>
              Supermercados Exito
            </Text>

            <LogoExito width={70} height={70} />

            <TouchableOpacity
              onPress={() => Linking.openURL('https://www.exito.com/')}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>
                https://www.exito.com/
              </Text>
            </TouchableOpacity>
          </View>

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

  /* Tarjeta de métricas */
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

  /* Tarjeta principal de donación */
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

  /* Etiqueta popular */
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

  /* Botón de donación */
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

  /* Texto de donación de insumos */
  supermercadoContainer: {
    paddingVertical: 20,
  },

  supermercadoText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },

  /* Contenedor de las tarjetas externas */
  infoContainer: {
    marginTop: 16,
    gap: 14,
  },

  /* Tarjetas informativas */
  infoBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#000',
  },

  infoTitle: {
    fontSize: 20,
    fontStyle: 'bold',
    color: '#1D3D47',
    marginBottom: 10,
  },

  infoText: {
    display: 'flex',
    alignItems: 'flex-end',
    fontSize: 13,
    color: '#64748b',
    lineHeight: 22,
  },

  linkText: {
    marginTop: 10,
    fontSize: 15,
    color: '#1d4ed8',
    fontStyle: 'underline',
  },
  

});

export default Donar;
