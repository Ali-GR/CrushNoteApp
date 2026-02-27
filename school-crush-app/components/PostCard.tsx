import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageCircle, Flag, Heart } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { supabase } from '../lib/supabase';

interface PostCardProps {
    post: any;
    onPress: () => void;
    onLike?: () => void;
    onReport?: () => void;
    userId?: string;
    commentCount?: number;
}

export const PostCard = ({ post, onPress, onLike, onReport, userId, commentCount }: PostCardProps) => {
    const scale = useSharedValue(1);
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [loading, setLoading] = useState(false);

    // Check if user already liked this post
    useEffect(() => {
        if (userId) {
            checkIfLiked();
        }
    }, [userId, post.id]);

    const checkIfLiked = async () => {
        const { data } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', userId)
            .maybeSingle();

        setLiked(!!data);
    };

    const animatedHeartStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handleLike = async () => {
        if (loading || !userId) return;
        setLoading(true);

        scale.value = withSequence(
            withSpring(1.3),
            withSpring(1)
        );

        if (liked) {
            // Unlike
            const { error } = await supabase
                .from('likes')
                .delete()
                .eq('post_id', post.id)
                .eq('user_id', userId);

            if (!error) {
                setLiked(false);
                setLikesCount((prev: number) => Math.max(0, prev - 1));
            }
        } else {
            // Like
            const { error } = await supabase
                .from('likes')
                .insert({ post_id: post.id, user_id: userId });

            if (!error) {
                setLiked(true);
                setLikesCount((prev: number) => prev + 1);
                if (onLike) onLike(); // Floating heart animation
            }
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
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    const CardContent = () => (
        <View style={styles.cardInner}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerText}>
                        <Text style={styles.nickname}>{post.profiles?.nickname || 'Anonym'}</Text>
                        <Text style={styles.school}> • {post.schools?.name || 'Schule'}</Text>
                    </Text>
                    <Text style={styles.timestamp}>{timeAgo(post.created_at)}</Text>
                </View>
                <TouchableOpacity onPress={onReport}>
                    <Flag size={16} color="#666" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <Text style={styles.content}>{post.content}</Text>

            {/* Footer */}
            <View style={styles.footer}>
                {/* Like Button */}
                <TouchableOpacity
                    style={styles.interactionBtn}
                    onPress={handleLike}
                    activeOpacity={0.7}
                >
                    <Animated.View style={[styles.iconContainer, animatedHeartStyle]}>
                        <Heart
                            size={20}
                            color="#FF10F0"
                            fill={liked ? '#FF10F0' : 'transparent'}
                        />
                    </Animated.View>
                    <Text style={styles.counterText}>{likesCount}</Text>
                </TouchableOpacity>

                {/* Comment Button */}
                <TouchableOpacity style={styles.interactionBtn} onPress={onPress}>
                    <View style={styles.iconContainer}>
                        <MessageCircle size={20} color="#fff" />
                    </View>
                    <Text style={styles.counterText}>{commentCount ?? 0}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.cardContainer}>
            <View style={[styles.glassBackground, { backgroundColor: 'rgba(26, 26, 46, 0.8)' }]} />
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            <CardContent />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 16, 240, 0.2)',
        shadowColor: '#FF10F0',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 3,
    },
    glassBackground: {
        ...StyleSheet.absoluteFillObject,
    },
    cardInner: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerText: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nickname: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    school: {
        color: '#B0B0B0',
        fontSize: 14,
    },
    timestamp: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    content: {
        color: '#FFFFFF',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 16,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    interactionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    iconContainer: {
        // just a wrapper
    },
    counterText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
