import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    colors?: [string, string, ...string[]];
    icon?: React.ReactNode;
}

export const GradientButton = ({
    title,
    onPress,
    loading,
    disabled,
    style,
    textStyle,
    colors = ['#FF3B3B', '#FF1493'], // Standard Red-Pink Theme
    icon
}: GradientButtonProps) => {

    if (disabled) {
        return (
            <TouchableOpacity
                style={[styles.container, styles.disabled, style]}
                disabled={true}
            >
                <Text style={[styles.text, styles.disabledText, textStyle]}>{title}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity onPress={onPress} disabled={loading} style={[styles.touchable, style]}>
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        {icon && <>{icon}</>}
                        <Text style={[styles.text, textStyle, icon ? { marginLeft: 8 } : {}]}>{title}</Text>
                    </>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    touchable: {
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#f43f5e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    container: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    text: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    disabled: {
        backgroundColor: '#333',
        borderRadius: 25,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledText: {
        color: '#666',
    }
});
