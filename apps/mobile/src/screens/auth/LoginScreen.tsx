import React from 'react'
import { Button, Text, View } from 'react-native'
import { useAuthStore } from '../../stores/auth';

export default function LoginScreen() {
    const { login } = useAuthStore();

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
            <Text>LoginScreen</Text>
            <Button title="Login" onPress={() => login('1234567890')} />
        </View>
    )
}