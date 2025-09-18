import { Button, Text, View } from 'react-native'
import { useAuthStore } from '../../stores/auth';

export default function ProfileScreen() {
    const logout = useAuthStore((s) => s.logout);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
            <Text>ProfileScreen</Text>
            <Button title="Logout" onPress={logout} />
        </View>
    )
}