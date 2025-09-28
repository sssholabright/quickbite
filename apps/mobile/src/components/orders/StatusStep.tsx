import { Animated, Text, View } from "react-native";
import { useTheme } from "../../theme/theme";
import { Icon } from "../../ui/Icon";
import { StatusStepProps } from "../../types/order";

export default function StatusStep({ step, currentStatus, statusSteps, pulseAnim }: StatusStepProps) {
    const theme = useTheme()
    const isActive = step.key === currentStatus;
    const isCompleted = statusSteps.findIndex(s => s.key === step.key) < statusSteps.findIndex(s => s.key === currentStatus);
    
    return (
        <View key={step.key} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            {/* Status Icon */}
            <View style={{
                width: 35,
                height: 35,
                borderRadius: 20,
                backgroundColor: isCompleted ? theme.colors.primary : 
                                isActive ? theme.colors.primary : theme.colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
                borderWidth: 2,
                borderColor: isActive ? theme.colors.primary : theme.colors.border,
            }}>
                {isCompleted ? (
                    <Icon name="checkmark" size={16} color="white" />
                ) : (
                    <Icon 
                        name={step.icon} 
                        size={16} 
                        color={isActive ? 'white' : theme.colors.muted} 
                    />
                )}
            </View>

            {/* Status Info */}
            <View style={{ flex: 1 }}>
                <Text style={{
                    fontSize: 14,
                    fontWeight: isActive ? '600' : '500',
                    color: isActive ? theme.colors.text : theme.colors.muted,
                    marginBottom: 4,
                }}>
                    {step.label}
                </Text>
                <Text style={{
                    fontSize: 12,
                    color: theme.colors.muted,
                }}>
                    {step.time}
                </Text>
            </View>

            {/* Pulse Animation for Active Status */}
            {isActive && (
                <Animated.View
                    style={{
                        position: 'absolute',
                        left: 0,
                        width: 35,
                        height: 35,
                        borderRadius: 20,
                        backgroundColor: theme.colors.primary,
                        opacity: 0.3,
                        transform: [{ scale: pulseAnim }],
                    }}
                />
            )}
        </View>
    )
}