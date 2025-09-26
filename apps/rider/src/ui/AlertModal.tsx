import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { useTheme } from '../theme/theme';
import { Icon } from './Icon';

interface AlertModalProps {
    visible: boolean;
    title?: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    onBackdropPress?: () => void;
}

export default function AlertModal({
    visible,
    title = 'Alert',
    message,
    type = 'info',
    onConfirm,
    onCancel,
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCancel = false,
    onBackdropPress,
}: AlertModalProps) {
    const theme = useTheme();

    const getTypeConfig = () => {
        switch (type) {
            case 'success':
                return {
                    color: theme.colors.primary,
                    icon: 'checkmark-circle',
                    backgroundColor: theme.colors.primary + '15',
                };
            case 'error':
                return {
                    color: theme.colors.danger,
                    icon: 'close-circle',
                    backgroundColor: theme.colors.danger + '15',
                };
            case 'warning':
                return {
                    color: '#FF9800',
                    icon: 'warning',
                    backgroundColor: '#FF980015',
                };
            case 'info':
            default:
                return {
                    color: theme.colors.primary,
                    icon: 'information-circle',
                    backgroundColor: theme.colors.primary + '15',
                };
        }
    };

    const typeConfig = getTypeConfig();

    const handleBackdropPress = () => {
        if (onBackdropPress) {
            onBackdropPress();
        } else if (onCancel) {
            onCancel();
        } else {
            onConfirm();
        }
    };

    return (
        <Modal 
            isVisible={visible} 
            animationIn="zoomIn" 
            animationOut="zoomOut"
            backdropOpacity={0.5}
            backdropColor={theme.mode === 'dark' ? '#000' : '#000'}
            onBackdropPress={handleBackdropPress}
            onBackButtonPress={handleBackdropPress}
        >
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {/* Icon */}
                <View style={[styles.iconContainer, { backgroundColor: typeConfig.backgroundColor }]}>
                    <Icon 
                        name={typeConfig.icon} 
                        size={32} 
                        color={typeConfig.color} 
                    />
                </View>

                {/* Title */}
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    {title}
                </Text>

                {/* Message */}
                <Text style={[styles.message, { color: theme.colors.muted }]}>
                    {message}
                </Text>

                {/* Buttons */}
                <View style={styles.buttonRow}>
                    {showCancel && (
                        <TouchableOpacity 
                            style={[styles.button, styles.cancel, { borderColor: theme.colors.border }]} 
                            onPress={onCancel || (() => {})}
                        >
                            <Text style={[styles.cancelText, { color: theme.colors.muted }]}>
                                {cancelText}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity 
                        style={[styles.button, styles.confirm, { backgroundColor: typeConfig.color }]} 
                        onPress={onConfirm}
                    >
                        <Text style={styles.confirmText}>
                            {confirmText}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
  container: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        gap: 12,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        minWidth: 100,
        alignItems: 'center',
    },
    cancel: {
        backgroundColor: 'transparent',
        borderWidth: 1,
    },
    confirm: {
        // backgroundColor set dynamically
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
    },
    confirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});