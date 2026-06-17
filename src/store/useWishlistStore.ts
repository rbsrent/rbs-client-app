import { create } from 'zustand';
import {
  addToGroup,
  BoatData,
  getGroupsContaining,
  isInAnyGroup,
  removeFromAllGroups,
  removeFromGroup,
  RECENT_GROUP_ID,
} from '@/shared/wishlist';

interface WishlistStore {
  // boatId → true if saved in any non-recent group
  saved: Record<string, boolean>;
  // boatId → set of groupIds it belongs to (non-recent)
  groupMembership: Record<string, Set<string>>;

  // check & cache a single boat
  checkBoat: (boatId: string) => Promise<void>;
  // optimistic set
  setBoatSaved: (boatId: string, value: boolean) => void;
  // add to group + update state
  addBoatToGroup: (groupId: string, boat: BoatData) => Promise<void>;
  // remove from group + update state
  removeBoatFromGroup: (groupId: string, boatId: string) => Promise<void>;
  // remove from ALL non-recent groups + update state
  removeBoatFromAll: (boatId: string) => Promise<void>;
  // reload membership for a boat (call after picker closes)
  refreshBoat: (boatId: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  saved:           {},
  groupMembership: {},

  checkBoat: async (boatId) => {
    const isSaved = await isInAnyGroup(boatId);
    set((s) => ({ saved: { ...s.saved, [boatId]: isSaved } }));
  },

  setBoatSaved: (boatId, value) => {
    set((s) => ({ saved: { ...s.saved, [boatId]: value } }));
  },

  addBoatToGroup: async (groupId, boat) => {
    await addToGroup(groupId, boat);
    set((s) => {
      const membership = new Set(s.groupMembership[boat.boat_id] ?? []);
      membership.add(groupId);
      return {
        saved: { ...s.saved, [boat.boat_id]: true },
        groupMembership: { ...s.groupMembership, [boat.boat_id]: membership },
      };
    });
  },

  removeBoatFromGroup: async (groupId, boatId) => {
    await removeFromGroup(groupId, boatId);
    set((s) => {
      const membership = new Set(s.groupMembership[boatId] ?? []);
      membership.delete(groupId);
      const stillSaved = membership.size > 0;
      return {
        saved: { ...s.saved, [boatId]: stillSaved },
        groupMembership: { ...s.groupMembership, [boatId]: membership },
      };
    });
  },

  removeBoatFromAll: async (boatId) => {
    await removeFromAllGroups(boatId);
    set((s) => ({
      saved: { ...s.saved, [boatId]: false },
      groupMembership: { ...s.groupMembership, [boatId]: new Set() },
    }));
  },

  refreshBoat: async (boatId) => {
    const [isSaved, groups] = await Promise.all([
      isInAnyGroup(boatId),
      getGroupsContaining(boatId),
    ]);
    const membership = new Set(groups.filter((g) => g !== RECENT_GROUP_ID));
    set((s) => ({
      saved: { ...s.saved, [boatId]: isSaved },
      groupMembership: { ...s.groupMembership, [boatId]: membership },
    }));
  },
}));
