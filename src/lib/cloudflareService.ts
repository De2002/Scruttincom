/**
 * Cloudflare D1 and R2 Client Service for Scruttin
 * Connects directly to Cloudflare Pages Functions (/api/*) and Cloudflare D1 database.
 */

export * from './d1Service';

// Aliases for explicit Cloudflare naming
import {
  uploadD1Media,
  fetchD1Stream,
  createD1Conversation,
  createD1Scrut,
  syncD1UserProfile,
  fetchD1UserProfile,
} from './d1Service';

export const uploadMediaToCloudflareR2 = uploadD1Media;
export const fetchStreamFromCloudflare = fetchD1Stream;
export const createConversationOnCloudflare = createD1Conversation;
export const createScrutOnCloudflare = createD1Scrut;
export const syncUserProfileToCloudflare = syncD1UserProfile;
export const fetchUserProfileFromCloudflare = fetchD1UserProfile;
