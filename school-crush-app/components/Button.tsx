import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
}

export const Button = ({ title, loading, variant = 'primary', style, disabled, ...props }: ButtonProps) => {
    const getBackgroundColor = () => {
        if (disabled) return '#333';
        switch (variant) {
            case 'secondary': return '#333';
            case 'danger': return '#ef4444';
            default: return '#f43f5e'; // Brand pink/red
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, { backgroundColor: getBackgroundColor() }, style]}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryText: {
        color: '#ccc',
    },
});
