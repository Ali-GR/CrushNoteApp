import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
} from 'react-native-reanimated';
import { Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const AnimatedTextChar = ({ char, index }: { char: string, index: number }) => {
    const opacity = useSharedValue(0);

    const style = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    useEffect(() => {
        opacity.value = withDelay(
            1000 + (index * 100), // Start after heart fade-in (1s) + staggered
            withTiming(1, { duration: 300 })
        );
    }, []);

    return (
        <Animated.Text style={[styles.titleText, style]}>
            {char}
        </Animated.Text>
    );
};

export default function SplashScreen() {
    const heartScale = useSharedValue(0);
    const heartOpacity = useSharedValue(0);

    const heartStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: heartScale.value }],
            opacity: heartOpacity.value,
        };
    });

    useEffect(() => {
        // 1. Heart Fade In
        heartOpacity.value = withTiming(1, { duration: 800 });

        // 2. Heart Pulse (2x)
        heartScale.value = withSequence(
            withTiming(1.2, { duration: 400 }),
            withTiming(1, { duration: 400 }),
            withTiming(1.2, { duration: 400 }),
            withTiming(1, { duration: 400 })
        );

        // 3. Haptic Feedback when text starts appearing
        const timeout = setTimeout(() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 1000);

        return () => {
            clearTimeout(timeout);
        };
    }, []);

    const title = "Crush Note";

    return (
        <View style={styles.container}>
            <Animated.View style={heartStyle}>
                <Heart size={80} color="#FF10F0" fill="#FF10F0" />
            </Animated.View>

            <View style={styles.textContainer}>
                {title.split('').map((char, index) => (
                    <AnimatedTextChar
                        key={index}
                        char={char}
                        index={index}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2d0a1f',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flexDirection: 'row',
        marginTop: 20,
    },
    titleText: {
        color: '#FF10F0',
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: 'System',
        textShadowColor: 'rgba(255, 16, 240, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
});
