import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, X, Check, Ban } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardScreen({ navigation }: any) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'reports' | 'banned'>('reports');
    const [reports, setReports] = useState<any[]>([]);
    const [bannedUsers, setBannedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReports();
        // fetchBannedUsers(); // Implement when schema supports bans/strikes fully
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('reports')
            .select('*'); // In real app, join with reporter/reported profiles

        if (data) setReports(data);
        setLoading(false);
    };

    const handleStrike = async (report: any) => {
        // Mock strike logic since we haven't updated schema with 'strikes' column yet or auth role logic
        // In real impl: 
        // 1. Get reported user ID from report (needs fetch join)
        // 2. Increment strikes in profiles table
        // 3. If strikes >= 3, set banned status

        // For demo:
        Alert.alert('Strike', `User has received a strike. (Simulated)`);

        // Remove report from list
        setReports(prev => prev.filter(r => r.id !== report.id));
        // Delete from DB
        await supabase.from('reports').delete().eq('id', report.id);
    };

    const handleDismiss = async (id: string) => {
        setReports(prev => prev.filter(r => r.id !== id));
        await supabase.from('reports').delete().eq('id', id);
    };

    const renderReportItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.label}>Grund: <Text style={styles.value}>{item.reason}</Text></Text>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.details}>Type: {item.target_type}</Text>

            <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionButton, styles.dismissButton]} onPress={() => handleDismiss(item.id)}>
                    <Text style={styles.actionText}>ABLEHNEN</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.strikeButton]} onPress={() => handleStrike(item)}>
                    <Text style={styles.actionText}>STRIKE</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <X color="#fff" size={24} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Shield color="#FFD700" size={24} fill="#FFD700" />
                    <Text style={styles.headerTitle}>Admin Dashboard</Text>
                </View>
                <View style={{ width: 24 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
                    onPress={() => setActiveTab('reports')}
                >
                    <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>Offene Reports</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'banned' && styles.activeTab]}
                    onPress={() => setActiveTab('banned')}
                >
                    <Text style={[styles.tabText, activeTab === 'banned' && styles.activeTabText]}>Gesperrte User</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === 'reports' ? (
                <FlatList
                    data={reports}
                    keyExtractor={item => item.id}
                    renderItem={renderReportItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>Keine offenen Reports.</Text>}
                />
            ) : (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>Keine gesperrten User.</Text>
                </View>
            )}
        </SafeAreaView>
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
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    tabs: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    activeTab: {
        backgroundColor: '#FF10F0',
    },
    tabText: {
        color: '#999',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#fff',
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: '#1A1A2E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        color: '#ccc',
    },
    value: {
        color: '#fff',
        fontWeight: 'bold',
    },
    date: {
        color: '#666',
        fontSize: 12,
    },
    details: {
        color: '#ddd',
        marginBottom: 16,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    dismissButton: {
        backgroundColor: '#333',
        borderWidth: 1,
        borderColor: '#666',
    },
    strikeButton: {
        backgroundColor: '#FF4444',
    },
    actionText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    emptyText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 40,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
