import "react-native-gesture-handler";
import { ThemeModeContext } from "./src/theme/theme";
import RootNavigator from "./src/navigation/RootNavigator";
import { QueryProvider } from "./src/providers/QueryProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
	return (
    <SafeAreaProvider>
      <ThemeModeContext.Provider value="system">
        <QueryProvider>
          <RootNavigator />
        </QueryProvider>
      </ThemeModeContext.Provider>
    </SafeAreaProvider>
	);
}