import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
} from "react-native";

import { useFonts } from "expo-font";

export default function Home() {

  const [fontsLoaded] = useFonts({
    Lobster: require("../assets//fonts/Lobster-Regular.ttf"),
    Montserrat: require("../assets/fonts/Montserrat-VariableFont_wght.ttf"),
  
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>

      <ImageBackground
        source={{
          uri: "https://i.pinimg.com/1200x/a2/0d/6b/a20d6be9b14a1f3186c6e8a3f9ad1120.jpg",
        }}
        style={styles.background}
        resizeMode="cover"
      >

        <View style={styles.StyleTitle}>

          <Text style={styles.title}>
            Bienvenido
          </Text>

          <Text style={styles.subtitle}>
            Lo que hoy es caos, mañana será el cimiento de tu nueva fortaleza
          </Text>

        </View>

      </ImageBackground>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  StyleTitle: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  title: {
    fontFamily: "Montserrat",
    fontSize: 45,
    color: "#FFFFFF",
    textAlign: "center",
  },

  subtitle: {
    fontFamily: "Lobster",
    fontSize: 25,
    marginTop: 15,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 30,
  },

});