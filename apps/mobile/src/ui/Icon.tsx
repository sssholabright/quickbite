import { memo } from "react";
import { TextStyle } from "react-native";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons"

type IconSet = "ion" | "mi" | "mci";

type Props = {
	name: string;
	size?: number;
	color?: string;
	style?: TextStyle;
	set?: IconSet;
};

function IconImpl({ name, size = 24, color = "#111827", style, set = "ion" }: Props) {
	switch (set) {
		case "mi":
			return <MaterialIcons name={name as any} size={size} color={color} style={style} />;
		case "mci":
			return <MaterialCommunityIcons name={name as any} size={size} color={color} style={style} />;
		default:
			return <Ionicons name={name as any} size={size} color={color} style={style} />;
	}
}

export const Icon = memo(IconImpl);