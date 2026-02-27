import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Easing, Dimensions } from 'react-native';
import { Heart } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FloatingHeartProps {
    onComplete: () => void;
    startX: number;
}

export const FloatingHeart = ({ onComplete, startX }: FloatingHeartProps) => {
    const position = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const scale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(position, {
                toValue: -SCREEN_HEIGHT * 0.4, // Float up 40% of screen
                duration: 2000,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: true,
                delay: 500, // Start fading out later
            }),
            Animated.spring(scale, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            })
        ]).start(() => onComplete());
    }, []);

    return (
        <Animated.View
            style={[
                styles.heart,
                {
                    left: startX,
                    transform: [
                        { translateY: position },
                        { scale: scale }
                    ],
                    opacity: opacity
                }
            ]}
        >
            <Heart fill="#f43f5e" color="#f43f5e" size={24} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    heart: {
        position: 'absolute',
        bottom: 100, // Start near the bottom (FAB position usually)
        zIndex: 9999,
    },
});
