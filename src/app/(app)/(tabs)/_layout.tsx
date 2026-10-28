import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/theme";

/**
 * Bottom tab bar — the signed-in hub (dark edition: navy bar, hairline
 * divider, indigo-400 active tint).
 *  - Chats  → private conversations list
 *  - Search → find people by name
 *  - Profile → view / edit my profile (+ sign out)
 *
 * Detail screens (chats/[id], users/[id]) live OUTSIDE this group on the
 * root Stack, so pushing them covers the tab bar and Back returns to it.
 */
export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="chats"
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 17,
          color: theme.colors.text,
        },
        tabBarActiveTintColor: theme.colors.primaryLight,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.borderSoft,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
