import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Heart, Search, ChevronRight } from 'lucide-react-native';
import { ScrollView } from 'react-native';

// Einfacher Typ für Schulen
type School = {
    id: string;
    name: string;
    city?: string;
};

// Props mit any (einfach, aber funktioniert)
export default function SchoolSelectScreen({ route, navigation }: any) {
    const { userId, email } = route.params;
    const [schools, setSchools] = useState<School[]>([]);
    const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    // Fehler- und Success-Dialog States
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchSchools();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = schools.filter(school =>
                school.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredSchools(filtered);
        } else {
            setFilteredSchools(schools);
        }
    }, [searchQuery, schools]);

    async function fetchSchools() {
        try {
            const { data, error } = await supabase
                .from('schools')
                .select('id, name')
                .order('name');
            if (error) throw error;
            setSchools(data || []);
            setFilteredSchools(data || []);
        } catch (error) {
            setErrorMessage(error.message || 'Failed to load schools');
            setShowError(true);
        }
    }

    async function joinSchool() {
        if (!selectedSchool) {
            setErrorMessage('Bitte wähle zuerst eine Schule aus.');
            setShowError(true);
            return;
        }
        setLoading(true);
        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ school_id: selectedSchool.id })
                .eq('id', userId);
            if (updateError) throw updateError;
            setSuccessMessage(`Du bist jetzt bei ${selectedSchool.name}!`);
            setShowSuccess(true);
        } catch (error) {
            setErrorMessage(error.message || 'Profil nicht gefunden. Bitte erneut versuchen.');
            setShowError(true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#2d0a1f' }]} />
            {/* Custom Error Dialog */}
            {showError && (
                <View style={styles.overlay}>
                    <View style={styles.dialogBox}>
                        <View style={styles.dialogIconContainer}>
                            <Heart color="#ff69b4" size={32} fill="#ff69b4" />
                        </View>
                        <Text style={styles.dialogTitle}>Fehler</Text>
                        <Text style={styles.dialogMessage}>{errorMessage}</Text>
                        <Button
                            title="OK"
                            onPress={() => setShowError(false)}
                            style={styles.dialogButton}
                        />
                    </View>
                </View>
            )}
            {/* Custom Success Dialog */}
            {showSuccess && (
                <View style={styles.overlay}>
                    <View style={styles.dialogBox}>
                        <View style={styles.dialogIconContainer}>
                            <Heart color="#ff69b4" size={32} fill="#ff69b4" />
                        </View>
                        <Text style={styles.dialogTitle}>Erfolg</Text>
                        <Text style={styles.dialogMessage}>{successMessage}</Text>
                        <Button
                            title="Weiter"
                            onPress={() => {
                                setShowSuccess(false);
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Main' }],
                                });
                            }}
                            style={styles.dialogButton}
                        />
                    </View>
                </View>
            )}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <View style={styles.iconContainer}>
                            <Heart color="#ff69b4" size={40} fill="#ff69b4" />
                        </View>
                        <Text style={styles.header}>Almost There!</Text>
                        <Text style={styles.subheader}>
                            Join your school to start crushing
                        </Text>
                    </View>

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            <Text style={styles.infoHighlight}>✨ Your name will be anonymous</Text>
                            {'\n'}(e.g., Anonym 12)
                        </Text>
                    </View>

                    {/* Search */}
                    <View style={styles.formContainer}>
                        <View style={styles.searchContainer}>
                            <Search color="#b3668c" size={20} style={styles.searchIcon} />
                            <Input
                                placeholder="Search your school..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                style={styles.searchInput}
                            />
                        </View>

                        {/* Schools List */}
                        {filteredSchools.length > 0 ? (
                            <View style={styles.listContainer}>
                                <Text style={styles.listTitle}>
                                    {searchQuery ? 'Search Results' : 'Available Schools'}
                                </Text>
                                {filteredSchools.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[
                                            styles.schoolItem,
                                            selectedSchool?.id === item.id && styles.schoolItemSelected
                                        ]}
                                        onPress={() => setSelectedSchool(item)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.schoolInfo}>
                                            <Text style={[
                                                styles.schoolName,
                                                selectedSchool?.id === item.id && styles.schoolNameSelected
                                            ]}>
                                                {item.name}
                                            </Text>
                                            {item.city && (
                                                <Text style={styles.schoolCity}>{item.city}</Text>
                                            )}
                                        </View>
                                        {selectedSchool?.id === item.id && (
                                            <View style={styles.checkmark}>
                                                <Heart color="#ff69b4" size={20} fill="#ff69b4" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>
                                    No schools found matching "{searchQuery}"
                                </Text>
                            </View>
                        )}

                        {/* Join Button */}
                        {selectedSchool && (
                            <Button
                                title={`Join ${selectedSchool.name}`}
                                onPress={joinSchool}
                                loading={loading}
                                style={styles.joinButton}
                            />
                        )}
                    </View>

                    {/* Skip */}
                    <TouchableOpacity
                        style={styles.skipContainer}
                        onPress={() => {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Main' }],
                            });
                        }}
                    >
                        <Text style={styles.skipText}>Skip for now</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2d0a1f',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 105, 180, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    header: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffb6c1',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 1,
    },
    subheader: {
        fontSize: 16,
        color: '#d88cae',
        textAlign: 'center',
    },
    infoBox: {
        backgroundColor: 'rgba(255, 105, 180, 0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#b34180',
        borderStyle: 'dashed',
    },
    infoText: {
        color: '#e6b3cc',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
    infoHighlight: {
        color: '#ff69b4',
        fontWeight: '600',
    },
    formContainer: {
        backgroundColor: 'rgba(74, 26, 47, 0.9)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#b34180',
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
    },
    searchIcon: {
        position: 'absolute',
        left: 12,
        zIndex: 1,
    },
    searchInput: {
        flex: 1,
        paddingLeft: 40,
        backgroundColor: 'rgba(45, 10, 31, 0.8)',
        borderColor: '#b34180',
        color: '#fff',
    },
    listContainer: {
        marginBottom: 16,
    },
    listTitle: {
        color: '#ffb6c1',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    schoolItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(45, 10, 31, 0.8)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#b34180',
        marginBottom: 8,
    },
    schoolItemSelected: {
        backgroundColor: 'rgba(255, 105, 180, 0.15)',
        borderColor: '#ff69b4',
    },
    schoolInfo: {
        flex: 1,
    },
    schoolName: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 4,
    },
    schoolNameSelected: {
        color: '#ff69b4',
        fontWeight: '600',
    },
    schoolCity: {
        fontSize: 14,
        color: '#b3668c',
    },
    checkmark: {
        marginLeft: 12,
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        color: '#b3668c',
        fontSize: 14,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    joinButton: {
        marginTop: 16,
        backgroundColor: '#ff1493',
        borderRadius: 12,
    },
    skipContainer: {
        alignItems: 'center',
        padding: 16,
    },
    skipText: {
        color: '#b3668c',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});

// Dialog Styles
const dialogStyles = {
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(45, 10, 31, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    dialogBox: {
        width: '80%',
        backgroundColor: '#3a1430',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ff69b4',
        shadowColor: '#ff69b4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    dialogIconContainer: {
        marginBottom: 12,
        backgroundColor: 'rgba(255, 105, 180, 0.15)',
        borderRadius: 32,
        padding: 8,
    },
    dialogTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ff69b4',
        marginBottom: 8,
        textAlign: 'center',
    },
    dialogMessage: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 18,
        textAlign: 'center',
    },
    dialogButton: {
        backgroundColor: '#ff69b4',
        borderRadius: 12,
        paddingHorizontal: 32,
        paddingVertical: 10,
    },
};