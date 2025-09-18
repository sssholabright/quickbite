import "react-native-gesture-handler";
import { ThemeModeContext } from "./src/theme/theme";
import RootNavigator from "./src/navigation/RootNavigator";
import { QueryProvider } from "./src/providers/QueryProvider";

export default function App() {
	return (
		<ThemeModeContext.Provider value="system">
			<QueryProvider>
				<RootNavigator />
			</QueryProvider>
		</ThemeModeContext.Provider>
	);
}