import { useRef, useState } from "react";
import { View, Text, FlatList, Dimensions } from "react-native";
import { useAuthStore } from "../../stores/auth";
import { Gradient } from "../../ui/Gradient";
import { CTAButton } from "../../ui/CTAButton";
import { useTheme } from "../../theme/theme";

const { width } = Dimensions.get("window");

const slides = [
	{ title: "Skip the line", desc: "Pre-order and pick up fast." },
	{ title: "Order ahead", desc: "Plan your meals, avoid waits." },
	{ title: "Pick up fresh", desc: "Get notified when ready." }
];

export default function OnboardingScreen() {
	const [idx, setIdx] = useState(0);
	const ref = useRef<FlatList>(null);
	const markSeen = useAuthStore((s) => s.markOnboardingSeen);
	const theme = useTheme();

	return (
		<Gradient>
			<FlatList
				ref={ref}
				data={slides}
				keyExtractor={(i) => i.title}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
				renderItem={({ item }) => (
					<View style={{ width, padding: 24, alignItems: "center", justifyContent: "center", gap: 12 }}>
						<Text style={{ fontSize: 28, fontWeight: "800", color: theme.colors.text, textAlign: "center" }}>{item.title}</Text>
						<Text style={{ color: theme.colors.muted, textAlign: "center" }}>{item.desc}</Text>
					</View>
				)}
			/>
			<View style={{ position: "absolute", bottom: 60, width: "100%", paddingHorizontal: 24, gap: 16 }}>
				<View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
					{slides.map((_, i) => (
						<View
							key={i}
							style={{
								width: i === idx ? 22 : 8,
								height: 8,
								borderRadius: 9999,
								backgroundColor: i === idx ? theme.colors.text : theme.colors.muted
							}}
						/>
					))}
				</View>
				<CTAButton
					title={idx < slides.length - 1 ? "Next" : "Get Started"}
					onPress={() => {
						if (idx < slides.length - 1) ref.current?.scrollToIndex({ index: idx + 1, animated: true });
						else markSeen();
					}}
				/>
			</View>
		</Gradient>
	);
}