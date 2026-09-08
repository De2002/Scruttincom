import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { MOCK_USERS } from '@/constants/mockData';
import {
  INITIAL_TAGGED_POSTS,
  TaggedPostItem,
  TaggedSticker,
  TaggedReply,
  TaggedPoll,
  STICKER_PACK,
  CURATED_GIFS,
  PHOTO_PRESETS,
} from '@/constants/taggedData';
import type { User } from '@/types';

const STORAGE_KEY_TAGGED = 'scruttin_tagged_user_ids';
const STORAGE_KEY_LIKES = 'scruttin_tagged_liked_ids';
const STORAGE_KEY_REPOSTS = 'scruttin_tagged_reposted_ids';
const STORAGE_KEY_BOOKMARKS = 'scruttin_tagged_bookmarked_ids';
const STORAGE_KEY_LOCAL_POSTS = 'scruttin_tagged_custom_posts';
const STORAGE_KEY_POLL_VOTES = 'scruttin_tagged_poll_votes';

export const TAGGERS_POSTING_THRESHOLD = 100;
export const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

const STORAGE_KEY_MY_TAGGERS_COUNT = 'scruttin_my_taggers_count';
const STORAGE_KEY_HAD_UNLOCKED = 'scruttin_had_unlocked_posting';
const STORAGE_KEY_GRACE_STARTED_AT = 'scruttin_grace_period_started_at';

export type TaggerEligibilityStatus = 'unlocked' | 'grace_period' | 'restricted' | 'locked';

const DEFAULT_TAGGED_IDS = ['u5', 'u1', 'u4', 'u2'];

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
  gracePeriodStartedAt: number | null;
  gracePeriodRemainingMs: number | null;
  gracePeriodDaysRemaining: number | null;
  gracePeriodHoursRemaining: number | null;
  
  setTaggersCount: (count: number) => void;
  incrementTaggers: (amount?: number, source?: string) => void;
  earnStreamOrDiveTaggers: (source?: 'stream' | 'dive') => void;
  simulateTaggersScenario: (scenario: 'grace_active' | 'grace_expired' | 'unlocked' | 'locked_new') => void;

  getTaggedUsersList: () => User[];
  allKnownUsers: User[];
  stickerPack: TaggedSticker[];
  curatedGifs: typeof CURATED_GIFS;
  photoPresets: typeof PHOTO_PRESETS;
}

const TaggedContext = createContext<TaggedContextType | null>(null);

export function TaggedProvider({ children }: { children: ReactNode }) {
  const [taggedIds, setTaggedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TAGGED);
      return stored ? JSON.parse(stored) : DEFAULT_TAGGED_IDS;
    } catch {
      return DEFAULT_TAGGED_IDS;
    }
  });

  const [likedIds, setLikedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LIKES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [repostedIds, setRepostedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REPOSTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [pollVotes, setPollVotes] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_POLL_VOTES);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [posts, setPosts] = useState<TaggedPostItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOCAL_POSTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure seed poll posts are available if user hasn't seen them
          const hasPollPost = parsed.some((p: TaggedPostItem) => p.poll);
          if (!hasPollPost) {
            const seedPolls = INITIAL_TAGGED_POSTS.filter((p) => p.poll);
            return [...seedPolls, ...parsed];
          }
          return parsed;
        }
      }
      return INITIAL_TAGGED_POSTS;
    } catch {
      return INITIAL_TAGGED_POSTS;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Taggers & posting eligibility state
  const [taggersCount, setTaggersCountState] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MY_TAGGERS_COUNT);
      if (stored !== null) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) return parsed;
      }
    } catch {
      /* storage unavailable */
    }
    // Default to 98 as explicitly given in user prompt (e.g. "If number goes down to maybe 98 person is given 7 days")
    return 98;
  });

  const [hadUnlockedPosting, setHadUnlockedPosting] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HAD_UNLOCKED);
      if (stored !== null) return stored === 'true';
    } catch {
      /* storage unavailable */
    }
    return true; // Default true so 98 enters grace period
  });

  const [gracePeriodStartedAt, setGracePeriodStartedAt] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_GRACE_STARTED_AT);
      if (stored !== null) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) return parsed;
      }
    } catch {
      /* storage unavailable */
    }
    // Default: grace period started 2 days ago, leaving 5 days
    return Date.now() - 2 * 24 * 60 * 60 * 1000;
  });

  // Keep grace timer reactive
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  // Compute status
  const taggerStatus: TaggerEligibilityStatus = (() => {
    if (taggersCount >= TAGGERS_POSTING_THRESHOLD) {
      return 'unlocked';
    }
    if (hadUnlockedPosting) {
      const started = gracePeriodStartedAt ?? now;
      const elapsed = now - started;
      if (elapsed < GRACE_PERIOD_MS) {
        return 'grace_period';
      }
      return 'restricted';
    }
    return 'locked';
  })();

  const canPostInTagged = taggerStatus === 'unlocked' || taggerStatus === 'grace_period';

  const gracePeriodRemainingMs: number | null = (() => {
    if (taggerStatus === 'grace_period' && gracePeriodStartedAt) {
      return Math.max(0, GRACE_PERIOD_MS - (now - gracePeriodStartedAt));
    }
    return null;
  })();

  const gracePeriodDaysRemaining = gracePeriodRemainingMs !== null
    ? Math.ceil(gracePeriodRemainingMs / (24 * 60 * 60 * 1000))
    : null;

  const gracePeriodHoursRemaining = gracePeriodRemainingMs !== null
    ? Math.floor((gracePeriodRemainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    : null;

  // Persist taggers count
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MY_TAGGERS_COUNT, taggersCount.toString());
    } catch {
      // Ignore localStorage write failures
    }
  }, [taggersCount]);

  // Persist hadUnlockedPosting
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HAD_UNLOCKED, hadUnlockedPosting ? 'true' : 'false');
    } catch {
      // Ignore localStorage write failures
    }
  }, [hadUnlockedPosting]);

  // Persist gracePeriodStartedAt
  useEffect(() => {
    try {
      if (gracePeriodStartedAt !== null) {
        localStorage.setItem(STORAGE_KEY_GRACE_STARTED_AT, gracePeriodStartedAt.toString());
      } else {
        localStorage.removeItem(STORAGE_KEY_GRACE_STARTED_AT);
      }
    } catch {
      // Ignore localStorage write failures
    }
  }, [gracePeriodStartedAt]);

  const setTaggersCount = useCallback((newCount: number) => {
    const safeCount = Math.max(0, Math.floor(newCount));
    setTaggersCountState(safeCount);

    if (safeCount >= TAGGERS_POSTING_THRESHOLD) {
      setHadUnlockedPosting(true);
      setGracePeriodStartedAt(null);
    } else {
      // Dropping below 100
      setHadUnlockedPosting((prevHad) => {
        if (prevHad) {
          // If had unlocked, start grace period if not already running
          setGracePeriodStartedAt((currentStart) => currentStart ?? Date.now());
        }
        return prevHad;
      });
    }
  }, []);

  const incrementTaggers = useCallback((amount = 1, source?: string) => {
    setTaggersCountState((prev) => {
      const next = prev + amount;
      if (next >= TAGGERS_POSTING_THRESHOLD && prev < TAGGERS_POSTING_THRESHOLD) {
        setHadUnlockedPosting(true);
        setGracePeriodStartedAt(null);
        toast.success(`🎉 Reached 100 Taggers! ${source ? `From ${source}. ` : ''}Posting in Tagged is now unlocked!`);
      } else if (source) {
        toast.info(`+${amount} Tagger from ${source}! (${next}/${TAGGERS_POSTING_THRESHOLD})`);
      }
      return next;
    });
  }, []);

  const earnStreamOrDiveTaggers = useCallback((source: 'stream' | 'dive' = 'stream') => {
    const sourceLabel = source === 'stream' ? 'Stream answer' : 'Dive conversation';
    incrementTaggers(1, sourceLabel);
  }, [incrementTaggers]);

  const simulateTaggersScenario = useCallback((scenario: 'grace_active' | 'grace_expired' | 'unlocked' | 'locked_new') => {
    if (scenario === 'grace_active') {
      setTaggersCountState(98);
      setHadUnlockedPosting(true);
      setGracePeriodStartedAt(Date.now() - 2 * 24 * 60 * 60 * 1000); // 5 days left
      toast.info('Simulated: 98 taggers with active 7-day grace period (5 days remaining to post)');
    } else if (scenario === 'grace_expired') {
      setTaggersCountState(98);
      setHadUnlockedPosting(true);
      setGracePeriodStartedAt(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago (expired)
      toast.error('Simulated: 98 taggers with 7-day grace period expired (posting restricted)');
    } else if (scenario === 'unlocked') {
      setTaggersCountState(105);
      setHadUnlockedPosting(true);
      setGracePeriodStartedAt(null);
      toast.success('Simulated: 105 taggers (posting fully unlocked)');
    } else if (scenario === 'locked_new') {
      setTaggersCountState(42);
      setHadUnlockedPosting(false);
      setGracePeriodStartedAt(null);
      toast.info('Simulated: 42 taggers on new account (posting locked, need 100 taggers)');
    }
  }, []);

  // Initial fetch / hydration window for perceived performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const refreshFeed = useCallback(async () => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 550));
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOCAL_POSTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPosts(parsed);
        }
      }
    } catch {
      /* storage unavailable */
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TAGGED, JSON.stringify(taggedIds));
    } catch (e) {
      console.warn('Failed to persist tagged users', e);
    }
  }, [taggedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LIKES, JSON.stringify(likedIds));
    } catch (e) {
      console.warn('Failed to persist likes', e);
    }
  }, [likedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REPOSTS, JSON.stringify(repostedIds));
    } catch (e) {
      console.warn('Failed to persist reposts', e);
    }
  }, [repostedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarkedIds));
    } catch (e) {
      console.warn('Failed to persist bookmarks', e);
    }
  }, [bookmarkedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_POLL_VOTES, JSON.stringify(pollVotes));
    } catch (e) {
      console.warn('Failed to persist poll votes', e);
    }
  }, [pollVotes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOCAL_POSTS, JSON.stringify(posts));
    } catch (e) {
      console.warn('Failed to persist custom posts', e);
    }
  }, [posts]);

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
    toast.success('Reply posted!');
  }, []);

  const getTaggedUsersList = useCallback(() => {
    return MOCK_USERS.filter((u) => taggedIds.includes(u.id));
  }, [taggedIds]);

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
        gracePeriodStartedAt,
        gracePeriodRemainingMs,
        gracePeriodDaysRemaining,
        gracePeriodHoursRemaining,
        setTaggersCount,
        incrementTaggers,
        earnStreamOrDiveTaggers,
        simulateTaggersScenario,
        getTaggedUsersList,
        allKnownUsers: MOCK_USERS,
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
