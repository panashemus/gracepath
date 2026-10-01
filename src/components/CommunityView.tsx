import { useState, useEffect, useCallback } from 'react';
import {
  Users, Lock, Sparkles, Heart, Loader2, Send, Crown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { hasProAccess } from '../lib/paywall';
import type { CommunityPost } from '../types';

const COMMUNITY_TAGS = ['Healing', 'Guidance', 'Family', 'Peace', 'Gratitude', 'Faith', 'Strength', 'Hope'];

interface CommunityViewProps {
  onShowUpgrade: () => void;
  onShowAuth: () => void;
}

export default function CommunityView({ onShowUpgrade, onShowAuth }: CommunityViewProps) {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAccess = hasProAccess();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        id, user_id, title, content, tags, prayers_count, created_at,
        profiles!community_posts_user_id_fkey(username)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) {
      setLoading(false);
      return;
    }

    let prayerMap: Record<string, boolean> = {};
    if (user) {
      const postIds = data.map((p) => p.id);
      const { data: myPrayers } = await supabase
        .from('post_prayers')
        .select('post_id')
        .in('post_id', postIds)
        .eq('user_id', user.id);
      prayerMap = {};
      (myPrayers ?? []).forEach((pp) => {
        prayerMap[pp.post_id] = true;
      });
    }

    const typed: CommunityPost[] = data.map((p) => ({
      id: p.id,
      user_id: p.user_id,
      title: p.title,
      body: p.content,
      tags: p.tags ?? [],
      prayer_count: p.prayers_count ?? 0,
      created_at: p.created_at,
      author_username: ((p.profiles as unknown as { username?: string } | { username?: string }[]) | undefined)?.username ?? null,
      has_prayed: prayerMap[p.id] ?? false,
    }));

    setPosts(typed);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (canAccess && user) {
      fetchPosts();
    } else {
      setLoading(false);
    }
  }, [canAccess, user, fetchPosts]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { onShowAuth(); return; }
    if (!title.trim() || !body.trim()) return;

    setSubmitting(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from('community_posts')
      .insert({
        user_id: user.id,
        title: title.trim(),
        content: body.trim(),
        tags: selectedTags,
      })
      .select('id, user_id, title, content, tags, prayers_count, created_at')
      .single();

    if (insertError) {
      setError('Unable to post. Please try again.');
      setSubmitting(false);
      return;
    }

    if (data) {
      const newPost: CommunityPost = {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        body: data.content,
        tags: data.tags ?? [],
        prayer_count: data.prayers_count ?? 0,
        created_at: data.created_at,
        author_username: profile?.username ?? null,
        has_prayed: false,
      };
      setPosts((prev) => [newPost, ...prev]);
    }

    setTitle('');
    setBody('');
    setSelectedTags([]);
    setShowForm(false);
    setSubmitting(false);
  };

  const handlePray = async (postId: string, postUserId: string, postTitle: string) => {
    if (!user) { onShowAuth(); return; }

    const post = posts.find((p) => p.id === postId);
    if (!post || post.has_prayed) return;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, has_prayed: true, prayer_count: p.prayer_count + 1 }
          : p
      )
    );

    const { error: prayError } = await supabase
      .from('post_prayers')
      .insert({ post_id: postId, user_id: user.id });

    if (prayError) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, has_prayed: false, prayer_count: p.prayer_count - 1 }
            : p
        )
      );
      return;
    }

    const { error: rpcError } = await supabase.rpc('increment_prayer_count', { post_id: postId });
    if (rpcError) {
      await supabase
        .from('community_posts')
        .update({ prayers_count: post.prayer_count + 1 })
        .eq('id', postId);
    }

    if (postUserId !== user.id) {
      await supabase.from('notifications').insert({
        recipient_id: postUserId,
        sender_id: user.id,
        actor_username: profile?.username ?? null,
        post_id: postId,
        post_title: postTitle,
        type: 'prayed',
      });
    }
  };

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-grain px-4 pb-20 pt-24 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="card overflow-hidden animate-fade-up">
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-ink-900 to-ink-800">
              <div className="absolute inset-0 flex items-center justify-center">
                <Users className="h-20 w-20 text-champagne-400/30" />
              </div>
              <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <Lock className="h-8 w-8 text-champagne-400" />
                <h2 className="mt-3 font-serif text-2xl font-semibold text-white">Fellowship Community</h2>
                <p className="mt-1 text-sm text-champagne-200/80">Exclusive to Pro members</p>
              </div>
            </div>
            <div className="p-8 text-center">
              <p className="text-ink-500">
                Join a community of believers sharing prayer requests, testimonies, and
                encouragement. Lift each other up with the "I Prayed For You" button and
                grow together in faith.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  'Share prayer requests with tags',
                  'Pray for others and get notified',
                  'Post testimonies and struggles',
                  'Encourage fellow believers',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 rounded-xl border border-ink-100 bg-ink-50/50 px-4 py-3 text-sm text-ink-600">
                    <Sparkles className="h-4 w-4 shrink-0 text-champagne-500" />
                    {feature}
                  </div>
                ))}
              </div>
              <button onClick={onShowUpgrade} className="btn-gold mt-8 text-sm">
                <Crown className="h-4 w-4" />
                Unlock with Pro — $9.99/mo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grain px-4 pb-20 pt-24 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 text-sm text-ink-400">
            <Users className="h-4 w-4" />
            <span>Fellowship & Prayer Community</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900 sm:text-4xl">Community</h1>
          <p className="mt-2 text-ink-500">
            Share your heart, pray for others, and walk together in faith.
          </p>
        </div>

        {!showForm ? (
          <button
            onClick={() => user ? setShowForm(true) : onShowAuth()}
            className="card mb-6 flex w-full items-center gap-3 p-4 text-left transition-all hover:shadow-card animate-fade-up"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-champagne-50">
              <Sparkles className="h-5 w-5 text-champagne-500" />
            </div>
            <span className="text-sm text-ink-500">Share a prayer request or testimony...</span>
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="card mb-6 p-6 animate-fade-up">
            {error && (
              <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
            )}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g., Praying for healing for my mother)"
              className="input-field mb-3"
              maxLength={120}
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your request, struggle, or testimony..."
              className="input-field mb-3 min-h-[120px] resize-y"
              maxLength={2000}
            />
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-ink-500">Tags</p>
              <div className="flex flex-wrap gap-2">
                {COMMUNITY_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-ink-900 text-white'
                        : 'border border-ink-200 bg-white text-ink-500 hover:border-ink-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || !title.trim() || !body.trim()}
                className="btn-gold flex-1 text-sm disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Post to Community
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setTitle(''); setBody(''); setSelectedTags([]); }}
                className="btn-ghost text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 w-1/3 rounded bg-ink-100" />
                <div className="mt-3 h-3 w-full rounded bg-ink-50" />
                <div className="mt-2 h-3 w-2/3 rounded bg-ink-50" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="card flex flex-col items-center justify-center px-6 py-16 text-center animate-fade-up">
            <Heart className="h-10 w-10 text-champagne-300" />
            <h2 className="mt-4 text-lg font-semibold text-ink-900">No posts yet</h2>
            <p className="mt-1 text-sm text-ink-500">Be the first to share a prayer request.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                onPray={() => handlePray(post.id, post.user_id, post.title)}
                onShowAuth={onShowAuth}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({
  post, onPray, onShowAuth, index,
}: {
  post: CommunityPost;
  onPray: () => void;
  onShowAuth: () => void;
  index: number;
}) {
  const date = new Date(post.created_at);
  const displayName = post.author_username
    ? `@${post.author_username}`
    : 'Anonymous';

  return (
    <div
      className="card p-5 transition-all duration-300 hover:shadow-card animate-fade-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-champagne-300">
          {(post.author_username ?? 'A').charAt(0).toUpperCase()}
        </span>
        <span className="text-sm font-medium text-ink-700">{displayName}</span>
        <span className="text-xs text-ink-400">
          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      <h3 className="mt-3 font-serif text-lg font-semibold text-ink-900">{post.title}</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-600">{post.body}</p>

      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-sage-50 px-2.5 py-0.5 text-xs font-medium text-sage-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 border-t border-ink-50 pt-3">
        <button
          onClick={onPray}
          disabled={post.has_prayed}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            post.has_prayed
              ? 'bg-sage-100 text-sage-700'
              : 'border border-ink-200 bg-white text-ink-600 hover:border-sage-300 hover:text-sage-600'
          }`}
        >
          <Heart className={`h-4 w-4 ${post.has_prayed ? 'fill-sage-500 text-sage-500' : ''}`} />
          {post.has_prayed ? 'Prayed' : 'I Prayed For You'}
          <span className="ml-1 text-xs font-semibold text-ink-400">{post.prayer_count}</span>
        </button>
      </div>
    </div>
  );
}
