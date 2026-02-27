import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Send, ArrowLeft, Flag, User } from 'lucide-react-native';
import { PostCard } from '../components/PostCard';

export default function CommentsScreen({ route, navigation }: any) {
    const { postId } = route.params;
    const { user } = useAuth();
    const [post, setPost] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPost();
        fetchComments();
    }, []);

    const fetchPost = async () => {
        // Fetch original post details
        const { data } = await supabase
            .from('posts')
            .select('*, profiles(nickname), schools(name)')
            .eq('id', postId)
            .single();
        if (data) setPost(data);
    };

    const fetchComments = async () => {
        const { data } = await supabase
            .from('comments')
            .select('*, profiles(nickname)')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (data) setComments(data);
    };

    const handleSend = async () => {
        if (!newComment.trim()) return;
        setLoading(true);

        const { error } = await supabase.from('comments').insert({
            post_id: postId,
            user_id: user?.id,
            content: newComment.trim(),
        });

        if (!error) {
            setNewComment('');
            fetchComments();
        }
        setLoading(false);
    };

    const timeAgo = (dateIdx: string) => {
        const date = new Date(dateIdx);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        return `${Math.floor(minutes / 60)}h ago`;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
                    <ArrowLeft color="#999" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kommentare</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    data={comments}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={
                        <View style={styles.postContainer}>
                            {post && (
                                <View style={styles.originalPost}>
                                    <View style={styles.postHeader}>
                                        <Text style={styles.postNickname}>{post.profiles?.nickname}</Text>
                                        <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
                                    </View>
                                    <Text style={styles.postContent}>{post.content}</Text>
                                </View>
                            )}
                            <View style={styles.divider} />
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.commentItem}>
                            <View style={styles.commentHeader}>
                                <Text style={styles.nickname}>{item.profiles?.nickname || 'Anonymous'} • <Text style={styles.time}>{timeAgo(item.created_at)}</Text></Text>
                            </View>
                            <Text style={styles.content}>{item.content}</Text>
                        </View>
                    )}
                    contentContainerStyle={styles.list}
                />

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Schreib was Nettes..."
                        placeholderTextColor="#999"
                        value={newComment}
                        onChangeText={setNewComment}
                        maxLength={300}
                        multiline
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={loading || !newComment.trim()}
                        style={styles.sendButton}
                    >
                        <Send color={newComment.trim() ? '#FF10F0' : '#666'} size={20} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#cc2952', // wie FeedScreen
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 10,
        backgroundColor: '#1A1A2E', // wie Header-Bar im Feed
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 16, 240, 0.2)',
    },
    headerTitle: {
        color: '#FF10F0',
        fontSize: 18,
        fontWeight: 'bold',
        textShadowColor: 'rgba(255, 16, 240, 0.3)',
        textShadowRadius: 5,
    },
    list: {
        padding: 16,
        paddingBottom: 20,
    },
    postContainer: {
        marginBottom: 20,
    },
    originalPost: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 12,
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#FF10F0',
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    postNickname: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    postTime: {
        color: '#888',
        fontSize: 12,
    },
    postContent: {
        color: '#ddd',
        fontSize: 14,
        lineHeight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginTop: 16,
    },
    commentItem: {
        marginBottom: 16,
        backgroundColor: '#1A1A2E',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    nickname: {
        color: '#999', // wie Platzhalter "Schreib was Nettes..."
        fontSize: 13,
        fontWeight: 'bold',
    },
    time: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'normal',
    },
    content: {
        color: '#fff',
        fontSize: 14,
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 30 : 12, // Handle safe area manually if needed or rely on avoids
        backgroundColor: '#151525',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        color: '#fff',
        marginRight: 10,
        maxHeight: 100,
        fontSize: 15,
    },
    sendButton: {
        padding: 8,
    },
});
