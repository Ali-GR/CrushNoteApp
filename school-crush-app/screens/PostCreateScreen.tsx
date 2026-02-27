import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

const BAD_WORDS = [
    // Deutsche Standard-Beleidigungen
    "arsch", "arschloch", "arschgeige", "arschkriecher", "arschgesicht", "arschficker",
    "affe", "affenpimmel", "affenarsch",
    "bastard", "blödmann", "blöde", "blödkopf", "blödsack", "blödian",
    "depp", "dummschwätzer", "dummkopf", "dummbeutel", "dussel", "dummerchen", "dummbatz",
    "drecksack", "drecksau", "drecksstück", "dreckskerl", "dreckstück", "drecksvieh",
    "fotze", "ficker", "fick", "ficken", "fick dich", "fickt euch", "fickstück",
    "hure", "hurensohn", "hurentochter", "hund", "hündin", "hundsfott",
    "idiot", "idiotin", "idiotisch",
    "kacke", "kack", "kacker", "kackbratze", "kackstelze", "kackhaufen",
    "kriecher", "kümmerling",
    "lusche", "lurch", "luser",
    "mist", "miststück", "mistkerl", "mistfink", "mistvieh", "misthund", "mistkäfer",
    "missgeburt", "misgeburt",
    "nutte", "nichtsnutz", "nulpe",
    "pisser", "piss", "pissnelke", "pisskerl", "pissfresse", "pissgesicht",
    "penner", "pfeife", "pflaume",
    "rotznase", "rotzlöffel", "rotz", "rotzig",
    "schlampe", "schlampen",
    "schwein", "schweinehund", "schweinebacke", "saublöd", "saudumm", "sau", "saubacke",
    "scheiße", "scheiss", "scheiß", "schleimscheißer", "schwachkopf", "schwachmat", "schwachmatt",
    "spasti", "spast", "spacken", "spacko", "spack", "spastisch",
    "trottel", "tussi", "tusse", "trottelig",
    "verpiss dich", "verpiss", "vollidiot", "vollpfosten", "volltrottel", "vollhonk",
    "wichser", "wixer", "wixxer", "wichs",
    "ziege", "zicke", "zimtzicke", "zickig",
    // Englische Beleidigungen
    "fuck", "fucking", "fucker", "motherfucker", "bitch", "slut", "whore",
    "shit", "bullshit", "dumbass", "asshole", "asshat", "jackass",
    "pussy", "cock", "cunt", "twat", "wanker", "dickhead",
    // Abkürzungen
    "hdf", "fickdich", "fick_dich", "stfu", "gtfo",
    // Leetspeak
    "4rsch", "4rschloch", "sch3iße", "sch3isse", "f1cker", "f1ck",
    // Jugendsprache / Rassismus / Ableismus
    "opfer", "behindert", "behindi",
    "schwuchtel", "kanake", "kanacke", "kanak",
    "zigeuner", "neger", "bimbo", "krüppel",
    "mong", "mongoid", "retard", "retarded",
    // Extreme Fälle
    "kill dich", "bring dich um", "umbringen", "töten",
    "vergewaltigung", "vergewaltigen", "vergewaltigt",
    "erschlagen", "ermorden", "umlegen", "abschlachten",
    // Emojis
    "🖕", "🤬",
];

// Lokaler Wortfilter
const checkWordFilter = (text: string): boolean => {
    const lower = text.toLowerCase();
    const escapedWords = BAD_WORDS.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'i');
    return pattern.test(lower);
};

export default function PostCreateScreen({ navigation }: any) {
    const { user, profile } = useAuth();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Rate Limiting Logic
    const checkRateLimit = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const key = `posts_count_${today}`;
            const count = await AsyncStorage.getItem(key);
            return count ? parseInt(count, 10) : 0;
        } catch (e) {
            return 0;
        }
    };

    const incrementRateLimit = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const key = `posts_count_${today}`;
            const current = await checkRateLimit();
            await AsyncStorage.setItem(key, (current + 1).toString());
        } catch (e) {
            console.error(e);
        }
    };

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handlePost = async () => {
        if (!content.trim()) return;

        // 1. Validate Content Length
        if (content.length > 500) return;

        setLoading(true);

        // 2. Lokaler Wortfilter
        if (checkWordFilter(content.trim())) {
            showToast("Dein Beitrag enthält unangemessene Wörter und wurde nicht veröffentlicht.");
            setLoading(false);
            return;
        }

        // 4. Post to Supabase
        const userSchoolId = profile?.school_id;

        if (!userSchoolId) {
            showToast("Fehler: Keine Schule zugewiesen.");
            setLoading(false);
            return;
        }

        const { error } = await supabase.from('posts').insert({
            content: content.trim(),
            user_id: user?.id,
            school_id: userSchoolId,
        });

        if (error) {
            showToast(error.message);
            setLoading(false);
        } else {
            showToast("Erfolg! Herz ausgeschüttet ❤️");
            setTimeout(() => {
                setLoading(false);
                navigation.goBack();
            }, 1000);
        }
    };

    const getCounterColor = () => {
        if (content.length >= 500) return '#FF4444';
        if (content.length > 400) return '#FFA500';
        return '#666';
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Custom Toast */}
                {toastMessage && (
                    <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={styles.toast}>
                        <Text style={styles.toastText}>{toastMessage}</Text>
                    </Animated.View>
                )}

                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Neuer Crush</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <X color="#fff" size={24} />
                    </TouchableOpacity>
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Was liegt dir auf dem Herzen? 💭"
                    placeholderTextColor="#666"
                    multiline
                    value={content}
                    onChangeText={setContent}
                    maxLength={500}
                    autoFocus
                />

                <View style={styles.footer}>
                    <Text style={[styles.counter, { color: getCounterColor() }]}>
                        {content.length}/500
                    </Text>

                    <TouchableOpacity
                        style={[
                            styles.postButton,
                            !content.trim() ? styles.postButtonDisabled : styles.postButtonActive
                        ]}
                        onPress={handlePost}
                        disabled={!content.trim() || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.postButtonText}>Herz ausschütten ❤️</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A2E', // Dark Violet-Blue
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    input: {
        flex: 1,
        padding: 20,
        fontSize: 18,
        color: '#fff',
        textAlignVertical: 'top',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    counter: {
        textAlign: 'right',
        marginBottom: 12,
        fontWeight: '600',
    },
    postButton: {
        borderRadius: 25,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    postButtonDisabled: {
        backgroundColor: '#333',
    },
    postButtonActive: {
        backgroundColor: '#FF10F0',
        elevation: 5,
        shadowColor: '#FF10F0',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    postButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    toast: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        backgroundColor: '#FF10F0',
        padding: 12,
        borderRadius: 8,
        zIndex: 100,
        alignItems: 'center',
    },
    toastText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});
