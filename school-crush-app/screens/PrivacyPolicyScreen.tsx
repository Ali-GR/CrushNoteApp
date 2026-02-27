import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

export default function PrivacyPolicyScreen({ navigation }: any) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Datenschutz</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Datenschutzerklärung</Text>
                <Text style={styles.date}>Stand: Februar 2026</Text>

                <Section title="1. Allgemeines">
                    <Text style={styles.paragraph}>
                        Der Schutz deiner Privatsphäre ist uns extrem wichtig. Diese App wurde so entwickelt, dass so wenig persönliche Daten wie möglich erhoben werden.
                    </Text>
                </Section>

                <Section title="2. Erhobene Daten">
                    <Text style={styles.bullet}>• <Text style={styles.bold}>Authentifizierung:</Text> Wir nutzen Supabase Auth. Deine E-Mail wird nur zur Anmeldung verwendet und ist für andere Nutzer niemals sichtbar.</Text>
                    <Text style={styles.bullet}>• <Text style={styles.bold}>Profil:</Text> Dein Nickname (z.B. Anonym 123) und deine Schule werden gespeichert, um die App-Funktionen bereitzustellen.</Text>
                    <Text style={styles.bullet}>• <Text style={styles.bold}>Inhalte:</Text> Deine Posts, Kommentare und Likes werden gespeichert. Diese sind anonym.</Text>
                </Section>

                <Section title="3. KI-Moderation">
                    <Text style={styles.paragraph}>
                        Um Mobbing und Hassrede zu verhindern, nutzen wir die OpenAI Moderation-KI. Gemeldete Inhalte werden zur automatisierten Prüfung an OpenAI übermittelt. Dabei werden keine persönlichen Identifikationsmerkmale (wie E-Mails) übertragen.
                    </Text>
                </Section>

                <Section title="4. Deine Rechte">
                    <Text style={styles.paragraph}>
                        Du hast jederzeit das Recht auf Auskunft, Berichtigung oder Löschung deiner Daten. In den Einstellungen findest du Funktionen, um deine Daten zu exportieren oder deinen gesamten Account sofort zu löschen.
                    </Text>
                </Section>

                <Section title="5. Kontakt">
                    <Text style={styles.paragraph}>
                        Bei Fragen zum Datenschutz wende dich bitte an den Support innerhalb der App.
                    </Text>
                </Section>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const Section = ({ title, children }: any) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
    </View>
);

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
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    title: {
        color: '#FF10F0',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    date: {
        color: '#666',
        fontSize: 12,
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    paragraph: {
        color: '#ccc',
        fontSize: 15,
        lineHeight: 22,
    },
    bullet: {
        color: '#ccc',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 8,
    },
    bold: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
