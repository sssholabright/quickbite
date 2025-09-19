import "react-native-gesture-handler";
import RootNavigator from "./src/navigation/RootNavigator";
import { QueryProvider } from "./src/providers/QueryProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
	return (
    <SafeAreaProvider>
      <QueryProvider>
        <RootNavigator />
      </QueryProvider>
    </SafeAreaProvider>
	);
}