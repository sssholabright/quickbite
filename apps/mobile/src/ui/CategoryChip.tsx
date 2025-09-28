import { Pressable, Text } from "react-native";
import { Icon } from "./Icon";
import { useTheme } from "../theme/theme";
import { CategoryChipProps } from "../types/vendor";

export function CategoryChip({ category, isSelected, onPress }: CategoryChipProps) {
    const theme = useTheme();
  
    return (
        <Pressable
            onPress={onPress}
            style={{
                backgroundColor: isSelected ? category.color : theme.colors.surface,
                paddingHorizontal: 16,
                paddingVertical: 4,
                borderRadius: 20,
                marginRight: 6,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: isSelected ? category.color : theme.colors.border
            }}
        >
            <Icon 
                name={category.icon} 
                size={14} 
                color={isSelected ? "white" : category.color} 
                style={{ marginRight: 6 }}
            />
            <Text style={{
                color: isSelected ? "white" : theme.colors.text,
                fontWeight: isSelected ? "600" : "500",
                fontSize: 12
            }}>
                {category.name}
            </Text>
        </Pressable>
    );
}