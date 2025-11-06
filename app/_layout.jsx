// app/_layout.jsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import React from "react";
import { Text, View } from "react-native";

// Custom drawer UI
function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      {/* Header / Profile */}
      <View style={{ padding: 16, borderBottomWidth: 1, borderColor: "#eee" }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: "#e6f0ff",
            marginBottom: 8,
          }}
        />
        <Text style={{ fontWeight: "700", fontSize: 16 }}>Bsl superUser</Text>
        <Text style={{ color: "#6b7280" }}>SuperUser</Text>
      </View>

      {/* Default items (screens) */}
      <DrawerItemList {...props} />

      {/* Footer */}
      <View
        style={{
          marginTop: "auto",
          padding: 16,
          borderTopWidth: 1,
          borderColor: "#eee",
        }}
      >
        <Text style={{ color: "#6b7280" }}>© Opsight AI Private Limited</Text>
      </View>
    </DrawerContentScrollView>
  );
}

// 👇 Expo Router requires ONE default export (this fixes warning)
export default function RootLayout() {
  return (
    <Drawer
      drawerContent={(p) => <CustomDrawerContent {...p} />}
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#111",
        drawerStyle: { backgroundColor: "#fff", width: 260 },
        drawerActiveTintColor: "#0b5cff",
        drawerInactiveTintColor: "#4b5563",
        drawerActiveBackgroundColor: "#e6f0ff",
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Plant Dashboard",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="speedometer-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="line-dashboard"
        options={{
          title: "Line Dashboard",
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="chart-timeline-variant"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="drive-monitoring"
        options={{
          title: "Drive Monitoring",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="car-sport-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="quality-monitoring"
        options={{
          title: "Quality Monitoring",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="maintenance"
        options={{
          title: "Maintenance",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="reports"
        options={{
          title: "Reports",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
    
  );
}
