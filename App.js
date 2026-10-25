import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import Home from "./screens/Home";
import Map from "./screens/Map";
import Help from "./screens/help";
import Donate from "./screens/donar";
import Profile from "./screens/perfilesUsuario";

const TABS = [
  { key: "home", label: "Home", icon: "home" },
  { key: "map", label: "Map", icon: "map" },
  { key: "help", label: "Help", icon: "hand-left" },
  { key: "donate", label: "Donate", icon: "heart" },
  { key: "profile", label: "Profile", icon: "person" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("home");

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return <Home />;
      case "map":
        return <Map />;
      case "help":
        return <Help />;
      case "donate":
        return <Donate />;
      case "profile":
        return <Profile />;
      default:
        return <Home />;
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom"]}
    >
      <View style={styles.content}>
        {renderScreen()}
      </View>

      <View style={styles.bottomBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                isActive && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  isActive
                    ? tab.icon
                    : `${tab.icon}-outline`
                }
                size={23}
                color={isActive ? "#1D3D47" : "#8E8E93"}
              />

              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  bottomBar: {
    height: 65,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabButton: {
    flex: 1,
    height: 55,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 2,
  },
  tabButtonActive: {
    backgroundColor: "#DCECEF",
  },
  tabLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 5,
  },
  tabLabelActive: {
    color: "#1D3D47",
    fontWeight: "700",
  },
});