import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import {
  TaggedPostItem,
  TaggedSticker,
  TaggedReply,
  TaggedPoll,
  STICKER_PACK,
  CURATED_GIFS,
  PHOTO_PRESETS,
} from '@/constants/taggedData';
import type { User } from '@/types';
import {
  fetchD1TaggedData,
  createD1TaggedPost,
  createD1TaggedReply,
  toggleD1UserTag,
  toggleD1PostInteraction,
  voteD1Poll,
} from '@/lib/d1Service';



export const TAGGERS_POSTING_THRESHOLD = 100;




export type TaggerEligibilityStatus = 'unlocked' | 'grace_period' | 'restricted' | 'locked';



export interface NewTaggedPostPayload {
  user: User;
  text: string;
  image_url?: string;
  gif_url?: string;
  sticker?: TaggedSticker;
  poll?: TaggedPoll;
  location_tag?: string;
  mood_tag?: string;
}

export interface TaggedContextType {
  taggedIds: string[];
  isTagged: (userId: string) => boolean;
  toggleTag: (user: User) => boolean;
  tagUser: (user: User) => void;
  untagUser: (userId: string) => void;
  
  likedIds: string[];
  toggleLike: (postId: string) => boolean;
  
  repostedIds: string[];
  toggleRepost: (postId: string) => boolean;
  
  bookmarkedIds: string[];
  toggleBookmark: (postId: string) => boolean;

  pollVotes: Record<string, string>;
  votePoll: (postId: string, optionId: string) => void;
  getUserPollVote: (postId: string) => string | undefined;
  
  posts: TaggedPostItem[];
  addPost: (payload: NewTaggedPostPayload) => TaggedPostItem;
  addReply: (postId: string, user: User, text: string, sticker?: TaggedSticker) => void;
  isLoading: boolean;
  refreshFeed: () => Promise<void>;
  
  // Taggers threshold & posting eligibility rules
  taggersCount: number;
  taggersThreshold: number;
  taggerStatus: TaggerEligibilityStatus;
  canPostInTagged: boolean;
  
  setTaggersCount: (count: number) => void;
  incrementTaggers: (amount?: number, source?: string) => void;
  earnStreamOrDiveTaggers: (source?: 'stream' | 'dive') => void;

  getTaggedUsersList: () => User[];
  allKnownUsers: User[];
  stickerPack: TaggedSticker[];
  curatedGifs: typeof CURATED_GIFS;
  photoPresets: typeof PHOTO_PRESETS;
}

const TaggedContext = createContext<TaggedContextType | null>(null);

export function TaggedProvider({ children }: { children: ReactNode }) {
  const [taggedIds, setTaggedIds] = useState<string[]>([]);

  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [repostedIds, setRepostedIds] = useState<string[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const [pollVotes, setPollVotes] = useState<Record<string, string>>({});

  const [posts, setPosts] = useState<TaggedPostItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // Taggers & posting eligibility state
  const [taggersCount, setTaggersCountState] = useState<number>(0);
  const allKnownUsers: User[] = [];

  const taggerStatus: TaggerEligibilityStatus = taggersCount >= TAGGERS_POSTING_THRESHOLD ? 'unlocked' : 'locked';
  const canPostInTagged = taggerStatus === 'unlocked';



  const setTaggersCount = useCallback((newCount: number) => {
    setTaggersCountState(Math.max(0, Math.floor(newCount)));
  }, []);

  const incrementTaggers = useCallback((amount = 1) => {
    setTaggersCountState((prev) => prev + Math.max(0, Math.floor(amount)));
  }, []);

  const earnStreamOrDiveTaggers = useCallback(() => {}, []);


  // Initial fetch / hydration from Cloudflare D1
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d1Data = await fetchD1TaggedData();
        if (mounted && d1Data) {
          setPosts(d1Data.posts ?? []);
          setTaggedIds(d1Data.userTags ?? []);
          setLikedIds(d1Data.likedIds ?? []);
          setRepostedIds(d1Data.repostedIds ?? []);
          setBookmarkedIds(d1Data.bookmarkedIds ?? []);
          setPollVotes(d1Data.pollVotes ?? {});
          setTaggersCountState(Number(d1Data.taggersCount) || 0);
        }
      } catch (err) {
        console.warn('[D1 Tagged] Initial load fallback:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const d1Data = await fetchD1TaggedData();
      if (d1Data) {
        setPosts(d1Data.posts ?? []);
        setTaggedIds(d1Data.userTags ?? []);
        setLikedIds(d1Data.likedIds ?? []);
        setRepostedIds(d1Data.repostedIds ?? []);
        setBookmarkedIds(d1Data.bookmarkedIds ?? []);
        setPollVotes(d1Data.pollVotes ?? {});
        setTaggersCountState(Number(d1Data.taggersCount) || 0);
      }
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);


  const isTagged = useCallback((userId: string) => taggedIds.includes(userId), [taggedIds]);

  const toggleTag = useCallback((user: User) => {
    let nowTagged = false;
    setTaggedIds((prev) => {
      if (prev.includes(user.id)) {
        nowTagged = false;
        toast.info(`Left ${user.display_name}'s world`);
        return prev.filter((id) => id !== user.id);
      } else {
        nowTagged = true;
        toast.success(`Tagged along with ${user.display_name}! You will see their world in your feed.`);
        return [...prev, user.id];
      }
    });
    return nowTagged;
  }, []);

  const tagUser = useCallback((user: User) => {
    setTaggedIds((prev) => {
      if (prev.includes(user.id)) return prev;
      toast.success(`Tagged along with ${user.display_name}!`);
      return [...prev, user.id];
    });
  }, []);

  const untagUser = useCallback((userId: string) => {
    setTaggedIds((prev) => prev.filter((id) => id !== userId));
  }, []);

  const toggleLike = useCallback((postId: string) => {
    let nowLiked = false;
    setLikedIds((prev) => {
      if (prev.includes(postId)) {
        nowLiked = false;
        return prev.filter((id) => id !== postId);
      } else {
        nowLiked = true;
        return [...prev, postId];
      }
    });
    return nowLiked;
  }, []);

  const toggleRepost = useCallback((postId: string) => {
    let nowReposted = false;
    setRepostedIds((prev) => {
      if (prev.includes(postId)) {
        nowReposted = false;
        toast.info('Removed Re-rut');
        return prev.filter((id) => id !== postId);
      } else {
        nowReposted = true;
        toast.success('Re-rutted to your world!');
        return [...prev, postId];
      }
    });
    return nowReposted;
  }, []);

  const toggleBookmark = useCallback((postId: string) => {
    let nowBookmarked = false;
    setBookmarkedIds((prev) => {
      if (prev.includes(postId)) {
        nowBookmarked = false;
        toast.info('Removed from saved posts');
        return prev.filter((id) => id !== postId);
      } else {
        nowBookmarked = true;
        toast.success('Saved to your bookmarks');
        return [...prev, postId];
      }
    });
    return nowBookmarked;
  }, []);

  const getUserPollVote = useCallback(
    (postId: string) => pollVotes[postId],
    [pollVotes]
  );

  const votePoll = useCallback(
    (postId: string, optionId: string) => {
      const prevVoted = pollVotes[postId];
      if (prevVoted === optionId) {
        // User clicked same option, do nothing or keep as voted
        return;
      }

      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id !== postId || !post.poll) return post;

          let chosenOptionText = '';
          const updatedOptions = post.poll.options.map((opt) => {
            let votes = opt.votes;
            if (opt.id === prevVoted) {
              votes = Math.max(0, votes - 1);
            }
            if (opt.id === optionId) {
              votes += 1;
              chosenOptionText = opt.text;
            }
            return { ...opt, votes };
          });

          const totalVotes = updatedOptions.reduce((sum, o) => sum + o.votes, 0);

          if (chosenOptionText) {
            toast.success(`Vote counted for "${chosenOptionText}"!`);
          }

          return {
            ...post,
            poll: {
              ...post.poll,
              options: updatedOptions,
              total_votes: totalVotes,
              user_voted_option_id: optionId,
            },
          };
        })
      );

      setPollVotes((prev) => ({
        ...prev,
        [postId]: optionId,
      }));
    },
    [pollVotes]
  );

  const addPost = useCallback((payload: NewTaggedPostPayload) => {
    if (!canPostInTagged) {
      toast.error('Posting restricted: You need at least 100 taggers to post in Tagged.');
      throw new Error('Posting restricted: 100 taggers required.');
    }

    const newPost: TaggedPostItem = {
      id: `tagpost-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user: payload.user,
      text: payload.text,
      image_url: payload.image_url,
      gif_url: payload.gif_url,
      sticker: payload.sticker,
      poll: payload.poll,
      location_tag: payload.location_tag,
      mood_tag: payload.mood_tag,
      created_at: new Date().toISOString(),
      like_count: 0,
      retag_count: 0,
      reply_count: 0,
      replies: [],
    };
    setPosts((prev) => [newPost, ...prev]);
    toast.success('Glimpse shared to Tagged!');

    // Persist to Cloudflare D1
    createD1TaggedPost({
      userId: payload.user.id,
      ...payload,
    }).catch((err) => console.warn('[D1 Tagged] Post creation fallback:', err));

    return newPost;
  }, [canPostInTagged]);

  const addReply = useCallback((postId: string, user: User, text: string, sticker?: TaggedSticker) => {
    const newReply: TaggedReply = {
      id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user,
      text,
      sticker,
      created_at: new Date().toISOString(),
      likes: 0,
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const currentReplies = p.replies || [];
          return {
            ...p,
            reply_count: (p.reply_count || currentReplies.length) + 1,
            replies: [...currentReplies, newReply],
          };
        }
        return p;
      })
    );

    // Persist reply to Cloudflare D1
    createD1TaggedReply(postId, user.id, text, sticker).catch((err) => {
      console.warn('[D1 Tagged] Reply creation fallback:', err);
    });
    toast.success('Reply posted!');
  }, []);

  const getTaggedUsersList = useCallback(() => {
    return allKnownUsers.filter((u) => taggedIds.includes(u.id));
  }, [allKnownUsers, taggedIds]);

  return (
    <TaggedContext.Provider
      value={{
        taggedIds,
        isTagged,
        toggleTag,
        tagUser,
        untagUser,
        likedIds,
        toggleLike,
        repostedIds,
        toggleRepost,
        bookmarkedIds,
        toggleBookmark,
        pollVotes,
        votePoll,
        getUserPollVote,
        posts,
        addPost,
        addReply,
        isLoading,
        refreshFeed,
        taggersCount,
        taggersThreshold: TAGGERS_POSTING_THRESHOLD,
        taggerStatus,
        canPostInTagged,

    setTaggersCount,
    incrementTaggers,
    earnStreamOrDiveTaggers,

        getTaggedUsersList,
        allKnownUsers: [],
        stickerPack: STICKER_PACK,
        curatedGifs: CURATED_GIFS,
        photoPresets: PHOTO_PRESETS,
      }}
    >
      {children}
    </TaggedContext.Provider>
  );
}

export function useTagged() {
  const context = useContext(TaggedContext);
  if (!context) {
    throw new Error('useTagged must be used within a TaggedProvider');
  }
  return context;
}
