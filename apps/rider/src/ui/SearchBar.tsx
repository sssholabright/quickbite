import { View, TextInput, Pressable } from "react-native";
import { Icon } from "./Icon";
import { useTheme } from "../theme/theme";
import { SearchBarProps } from "../types/vendor";

export function SearchBar({ value, onChangeText, onFocus, placeholder = "Search vendors or meals..." }: SearchBarProps) {
    const theme = useTheme();
  
    return (
        <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 2,
            marginHorizontal: 16,
            marginVertical: 8,
            borderWidth: 1,
            borderColor: theme.colors.border
        }}>
            <Icon name="search" size={20} color={theme.colors.muted} />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                onFocus={onFocus}
                placeholder={placeholder}
                placeholderTextColor={theme.colors.muted}
                style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    color: theme.colors.text
                }}
            />
            {value.length > 0 && (
                <Pressable onPress={() => onChangeText("")}>
                    <Icon name="close-circle" size={20} color={theme.colors.muted} />
                </Pressable>
            )}
        </View>
    );
}