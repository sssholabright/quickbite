import { useEffect, useRef } from "react";
import { Animated, Easing, Image, View } from "react-native";
import { Gradient } from "../../ui/Gradient";

export default function SplashScreen() {
    const scale = useRef(new Animated.Value(0.9)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(scale, { toValue: 1, duration: 1200, easing: Easing.out(Easing.exp), useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true })
        ]).start();
    }, []);

    return (
        <Gradient>
            <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
                <Animated.View style={{ transform: [{ scale }], opacity }}>
                    {/* <Image source={require("../../assets/logo.png")} style={{ width: 120, height: 120, borderRadius: 24 }} /> */}
                </Animated.View>
            </View>
        </Gradient>
    );
}