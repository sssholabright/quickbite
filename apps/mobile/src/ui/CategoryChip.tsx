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
                backgroundColor: isSelected ? category.color : `${category.color}20`, // 20% opacity when not selected
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 6,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: category.color
            }}
        >
            <Text style={{
                color: isSelected ? "white" : category.color,
                fontWeight: isSelected ? "600" : "500",
                fontSize: 12
            }}>
                {category.name}
            </Text>
        </Pressable>
    );
}