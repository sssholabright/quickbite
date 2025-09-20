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

// Icon mapping for common icons
const iconMap: Record<string, { name: string; set: IconSet }> = {
	// Navigation & UI
	"home": { name: "home-outline", set: "ion" },
	"search": { name: "search-outline", set: "ion" },
	"menu": { name: "menu-outline", set: "ion" },
	"close": { name: "close-outline", set: "ion" },
	"back": { name: "arrow-back-outline", set: "ion" },
	"forward": { name: "arrow-forward-outline", set: "ion" },
	
	// Cart & Shopping
	"shopping-cart": { name: "cart-outline", set: "ion" },
	"bag": { name: "bag-outline", set: "ion" },
	"plus": { name: "add-outline", set: "ion" },
	"minus": { name: "remove-outline", set: "ion" },
	"add": { name: "add-outline", set: "ion" },
	"remove": { name: "remove-outline", set: "ion" },
	"trash": { name: "trash-outline", set: "ion" },
	
	// Time & Status
	"time": { name: "time-outline", set: "ion" },
	"clock": { name: "time-outline", set: "ion" },
	"star": { name: "star-outline", set: "ion" },
	"star-filled": { name: "star", set: "ion" },
	
	// Layout & View
	"grid": { name: "grid-outline", set: "ion" },
	"list": { name: "list-outline", set: "ion" },
	
	// Food & Categories
	"restaurant": { name: "restaurant-outline", set: "ion" },
	"pizza": { name: "pizza-outline", set: "ion" },
	"cafe": { name: "cafe-outline", set: "ion" },
	"wine": { name: "wine-outline", set: "ion" },
	"ice-cream": { name: "ice-cream-outline", set: "ion" },
	"fast-food": { name: "fast-food-outline", set: "ion" },
	
	// User & Profile
	"user": { name: "person-outline", set: "ion" },
	"profile": { name: "person-circle-outline", set: "ion" },
	"settings": { name: "settings-outline", set: "ion" },
	
	// Actions
	"heart": { name: "heart-outline", set: "ion" },
	"heart-filled": { name: "heart", set: "ion" },
	"share": { name: "share-outline", set: "ion" },
	"location": { name: "location-outline", set: "ion" },
	"phone": { name: "call-outline", set: "ion" },
	"mail": { name: "mail-outline", set: "ion" },
	
	// Status & Indicators
	"check": { name: "checkmark-outline", set: "ion" },
	"check-circle": { name: "checkmark-circle-outline", set: "ion" },
	"warning": { name: "warning-outline", set: "ion" },
	"error": { name: "alert-circle-outline", set: "ion" },
	"info": { name: "information-circle-outline", set: "ion" },
	
	// Arrows & Navigation
	"arrow-up": { name: "arrow-up-outline", set: "ion" },
	"arrow-down": { name: "arrow-down-outline", set: "ion" },
	"arrow-left": { name: "arrow-back-outline", set: "ion" },
	"arrow-right": { name: "arrow-forward-outline", set: "ion" },
	"chevron-up": { name: "chevron-up-outline", set: "ion" },
	"chevron-down": { name: "chevron-down-outline", set: "ion" },
	"chevron-left": { name: "chevron-back-outline", set: "ion" },
	"chevron-right": { name: "chevron-forward-outline", set: "ion" },
	"cash": { name: "cash-outline", set: "ion" },
	"card": { name: "card-outline", set: "ion" },
	"checkmark": { name: "checkmark-outline", set: "ion" },
	"checkmark-circle": { name: "checkmark-circle-outline", set: "ion" },
	"checkmark-done": { name: "checkmark-done-outline", set: "ion" },
	"notifications": { name: "notifications-outline", set: "ion" },
	'create': { name: 'create-outline', set: 'ion' },
	'location-outline': { name: 'location-outline', set: 'ion' },
	'chatbubble': { name: 'chatbubble-outline', set: 'ion' },
	'language': { name: 'language-outline', set: 'ion' },
	'help-circle': { name: 'help-circle-outline', set: 'ion' },
	'chatbubble-ellipses': { name: 'chatbubble-ellipses-outline', set: 'ion' },
	'information-circle': { name: 'information-circle-outline', set: 'ion' },
	'document-text': { name: 'document-text-outline', set: 'ion' },
	'shield-checkmark': { name: 'shield-checkmark-outline', set: 'ion' },
	'card-outline': { name: 'card-outline', set: 'ion' },
	'wallet': { name: 'wallet-outline', set: 'ion' },
	'color-palette': { name: 'color-palette-outline', set: 'ion' },
};

function IconImpl({ name, size = 24, color = "#111827", style, set = "ion" }: Props) {
	// Check if the icon exists in our mapping
	const iconConfig = iconMap[name];
	
	if (iconConfig) {
		const { name: iconName, set: iconSet } = iconConfig;
		
		switch (iconSet) {
			case "mi":
				return <MaterialIcons name={iconName as any} size={size} color={color} style={style} />;
			case "mci":
				return <MaterialCommunityIcons name={iconName as any} size={size} color={color} style={style} />;
			default:
				return <Ionicons name={iconName as any} size={size} color={color} style={style} />;
		}
	}
	
	// Fallback to direct icon name if not in mapping
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