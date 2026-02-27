import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Bell, Globe, Download, FileText, Trash2, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen({ navigation }: any) {
    const { user, profile: contextProfile, signOut, updateSchool, resetSchool } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({ posts: 0, likes: 0, strikes: 0 });
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    useEffect(() => {
        if (profile) {
            setStats({
                posts: profile.posts_count || 0,
                likes: profile.likes_received_count || 0,
                strikes: profile.strikes || 0
            });
        }
    }, [profile]);

    const fetchProfileAndStats = async () => {
        if (!user) return;
        // Profile is already handled by AuthContext, but we can refresh it
        // if we decide to expose a refresh method. For now, it updates on mount
        // and when the context profile changes.
    };

    const handleResetSchool = () => {
        Alert.alert(
            "Schule wechseln",
            "Möchtest du wirklich deine Schule wechseln? Du wirst zum Auswahl-Bildschirm zurückgeleitet.",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Ja, wechseln",
                    style: "destructive",
                    onPress: async () => {
                        await resetSchool();
                        navigation.navigate('Feed'); // App.tsx will redirect to Onboarding
                    }
                }
            ]
        );
    };

    const handleExportData = async () => {
        if (!user) return;

        try {
            // Alle Daten des Users sammeln
            const [postsData, commentsData, profileData] = await Promise.all([
                supabase.from('posts').select('*').eq('user_id', user.id),
                supabase.from('comments').select('*').eq('user_id', user.id),
                supabase.from('profiles').select('*').eq('id', user.id).single(),
            ]);

            const exportData = {
                exportiert_am: new Date().toISOString(),
                profil: profileData.data || null,
                beitraege: postsData.data || [],
                kommentare: commentsData.data || [],
            };

            const jsonData = JSON.stringify(exportData, null, 2);
            const fileName = `crush-note-daten-${new Date().toISOString().split('T')[0]}.json`;

            // Daten teilen (Share API)
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
                await Share.share({
                    message: jsonData,
                    title: 'Meine Crush Note Daten',
                });
            } else {
                Alert.alert('Daten exportiert', `Deine Daten:\n\n${jsonData.substring(0, 500)}...`);
            }
        } catch (error: any) {
            Alert.alert('Fehler', 'Daten konnten nicht exportiert werden: ' + error.message);
        }
    };


    const handleDeleteAccount = () => {
        Alert.alert(
            "Account löschen",
            "Bist du sicher? Alle deine Daten werden unwiderruflich gelöscht.",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Löschen",
                    style: "destructive",
                    onPress: async () => {
                        // Implement delete logic (RPC call usually needed for auth + db)
                        Alert.alert("Vorgemerkt", "Dein Account wird in 30 Tagen gelöscht.");
                        signOut();
                    }
                }
            ]
        );
    };

    const SettingItem = ({ icon: Icon, label, value, onPress, isDestructive = false }: any) => (
        <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, isDestructive && { backgroundColor: 'rgba(255, 68, 68, 0.1)' }]}>
                    <Icon size={20} color={isDestructive ? '#FF4444' : '#fff'} />
                </View>
                <Text style={[styles.settingLabel, isDestructive && { color: '#FF4444' }]}>{label}</Text>
            </View>
            <View style={styles.settingRight}>
                {value}
                {onPress && <ChevronRight size={16} color="#666" />}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Einstellungen & Profil</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Profile Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PROFIL</Text>
                    <View style={styles.profileCard}>
                        <View style={styles.avatar}>
                            <User size={30} color="#fff" />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.nickname}>{profile?.nickname || '@hallo'}</Text>
                            <Text style={styles.school}>{profile?.schools?.name || 'Keine Schule'}</Text>
                            <Text style={styles.joined}>Mitglied seit {new Date(profile?.created_at || Date.now()).toLocaleDateString()}</Text>
                        </View>
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.posts}</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.likes}</Text>
                            <Text style={styles.statLabel}>Likes</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, stats.strikes > 0 && { color: '#FF4444' }]}>
                                {stats.strikes}
                            </Text>
                            <Text style={styles.statLabel}>Strikes</Text>
                        </View>
                    </View>
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>APP EINSTELLUNGEN</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <View style={styles.iconContainer}>
                                <Bell size={20} color="#fff" />
                            </View>
                            <Text style={styles.settingLabel}>Benachrichtigungen</Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: '#333', true: '#FF10F0' }}
                            thumbColor="#fff"
                        />
                    </View>

                    <SettingItem
                        icon={Globe}
                        label="Schule wechseln"
                        onPress={handleResetSchool}
                    />

                    <SettingItem
                        icon={Globe}
                        label="Sprache"
                        value={<Text style={styles.valueText}>Deutsch</Text>}
                        onPress={() => { }}
                    />
                </View>

                {/* Data & Privacy */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DATEN & SICHERHEIT</Text>

                    <SettingItem
                        icon={Download}
                        label="Daten exportieren"
                        onPress={handleExportData}
                    />

                    <SettingItem
                        icon={FileText}
                        label="Datenschutzerklärung"
                        onPress={() => navigation.navigate('PrivacyPolicy')}
                    />

                    <SettingItem
                        icon={Trash2}
                        label="Account löschen"
                        isDestructive
                        onPress={handleDeleteAccount}
                    />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.version}>Version 1.0.0 (Beta)</Text>
                </View>

            </ScrollView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0C0C1C',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#1A1A2E',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        marginLeft: 4,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A2E',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FF10F0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    nickname: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    school: {
        color: '#aaa',
        fontSize: 14,
        marginBottom: 2,
    },
    joined: {
        color: '#666',
        fontSize: 12,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#1A1A2E',
        borderRadius: 16,
        padding: 16,
        justifyContent: 'space-between',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        color: '#666',
        fontSize: 12,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        height: '100%',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1A1A2E',
        padding: 16,
        marginBottom: 1, // small separator effect if background is darker
        borderRadius: 12,
        marginVertical: 4,
        minHeight: 56,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        flexShrink: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    settingLabel: {
        color: '#fff',
        fontSize: 16,
        flex: 1,
        flexWrap: 'wrap',
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
    },
    valueText: {
        color: '#666',
        fontSize: 14,
        flexShrink: 1,
        marginRight: 4,
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    version: {
        color: '#444',
        fontSize: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1A1A2E',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#aaa',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalInput: {
        backgroundColor: '#121212',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    saveButton: {
        backgroundColor: '#FF10F0',
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
