import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Heart } from 'lucide-react-native';

export default function OnboardingScreen() {
    const { user, profile, checkProfile } = useAuth();
    const [schoolSearch, setSchoolSearch] = useState('');
    const [schools, setSchools] = useState<any[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // 🔍 Schulen erst suchen, wenn getippt wird
    useEffect(() => {
        const searchSchools = async () => {
            if (schoolSearch.trim() === '') {
                setSchools([]);
                return;
            }

            setSearching(true);
            console.log("🔍 Search triggered for:", schoolSearch);

            // Try simplest possible query
            const { data, error } = await supabase
                .from('schools')
                .select('id, name')
                .ilike('name', `%${schoolSearch}%`)
                .limit(200);

            if (error) {
                console.error("DEBUG - RAW SEARCH ERROR:", JSON.stringify(error, null, 2));
                // Fallback: Just try to get anything from schools
                const { data: fallbackData } = await supabase.from('schools').select('id, name').limit(10);
                if (fallbackData) {
                    console.log("Fallback search worked, found:", fallbackData.length);
                    setSchools(fallbackData);
                }
            } else if (data) {
                console.log("Found schools:", data.length);
                setSchools(data);
            }
            setSearching(false);
        };

        const timer = setTimeout(() => {
            searchSchools();
        }, 300); // Slightly faster search

        return () => clearTimeout(timer);
    }, [schoolSearch]);

    async function completeProfile() {
        if (!selectedSchool) {
            Alert.alert('Schule fehlt', 'Bitte wähle deine Schule aus.');
            return;
        }
        setLoading(true);
        await updateProfileSchool(selectedSchool.id);
    }

    async function updateProfileSchool(schoolId: string) {
        if (!user) return;

        // Upsert nutzen: Falls das Profil (aus welchem Grund auch immer) noch nicht existiert,
        // wird es hier erstellt. Falls es existiert, wird nur die school_id aktualisiert.
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                school_id: schoolId,
                nickname: profile?.nickname || 'Anonym'
            });

        if (error) {
            console.error('Onboarding Error:', error);
            Alert.alert('Fehler', 'Profil konnte nicht aktualisiert werden.');
            setLoading(false);
        } else {
            Alert.alert('Willkommen!', 'Du bist jetzt bereit.');
            await checkProfile(user.id);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#2d0a1f' }]} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <View style={styles.iconContainer}>
                            <Heart color="#ff69b4" size={40} fill="#ff69b4" />
                        </View>
                        <Text style={styles.header}>Crush Note</Text>
                        <Text style={styles.subheader}>Fast geschafft! Tritt deiner Schule bei.</Text>
                    </View>

                    {/* Form Container */}
                    <View style={styles.formContainer}>
                        <Input
                            label="Deine Schule"
                            value={schoolSearch}
                            onChangeText={setSchoolSearch}
                            placeholder="Schulnamen suchen..."
                        />

                        {searching && (
                            <ActivityIndicator color="#ff69b4" style={{ marginVertical: 10 }} />
                        )}

                        {/* List of schools */}
                        {schools.length > 0 && !selectedSchool && (
                            <ScrollView
                                style={styles.schoolList}
                                keyboardShouldPersistTaps="handled"
                                nestedScrollEnabled={true}
                            >
                                {schools.map(school => (
                                    <TouchableOpacity
                                        key={school.id}
                                        style={styles.schoolItem}
                                        onPress={() => {
                                            setSelectedSchool(school);
                                            setSchoolSearch(school.name);
                                        }}
                                    >
                                        <Text style={styles.schoolName}>{school.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {schoolSearch && schools.length === 0 && !searching && !selectedSchool && (
                            <Text style={styles.noResults}>Keine Schule gefunden.</Text>
                        )}

                        <Button
                            title={selectedSchool ? `An "${selectedSchool.name}" anmelden` : "Schule beitreten"}
                            loading={loading}
                            onPress={completeProfile}
                            disabled={!selectedSchool}
                            style={styles.mainButton}
                        />

                        <Button
                            title="Abmelden"
                            variant="secondary"
                            onPress={() => supabase.auth.signOut()}
                            style={styles.switchButton}
                        />
                    </View>
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
        justifyContent: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
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
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffb6c1',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 1,
    },
    subheader: {
        fontSize: 18,
        color: '#d88cae',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    formContainer: {
        backgroundColor: 'rgba(74, 26, 47, 0.9)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#b34180',
    },
    schoolList: {
        maxHeight: 250,
        marginTop: -10,
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden',
    },
    schoolItem: {
        backgroundColor: 'rgba(179, 65, 128, 0.2)',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 105, 180, 0.1)',
    },
    schoolName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    schoolCode: {
        color: '#ffb6c1',
        fontSize: 12,
        marginTop: 2,
    },
    noResults: {
        color: '#d88cae',
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    mainButton: {
        marginBottom: 16,
        backgroundColor: '#ff1493',
        borderRadius: 12,
    },
    switchButton: {
        backgroundColor: 'rgba(179, 65, 128, 0.3)',
        borderWidth: 1,
        borderColor: '#ff69b4',
        borderRadius: 12,
    },
});
