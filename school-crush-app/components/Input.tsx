import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
}

export const Input = ({ label, error, style, ...props }: InputProps) => {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[styles.input, error ? styles.inputError : null, style]}
                placeholderTextColor="#666"
                {...props}
            />
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    label: {
        color: '#ccc',
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#1E1E1E',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 16,
    },
    inputError: {
        borderColor: '#ef4444',
    },
    error: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
    },
});
