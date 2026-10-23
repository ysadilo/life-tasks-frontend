export type BoardRole = 'owner' | 'member';

export interface BoardMember {
  userId: string;
  email: string;
  role: BoardRole;
  /** True for the signed-in user's own membership. */
  isMe: boolean;
}

export interface Board {
  id: string;
  name: string;
  /** Shared boards have members and take invites; personal ones are private. */
  shared: boolean;
  /** The caller's role on this board. */
  role: BoardRole;
  members: BoardMember[];
  /** Pending invites; only populated for the owner. */
  invites: { id: string; email: string }[];
  /** Open one-off work on the board for the caller's local day. */
  /** Join-link code (owner only); null when the link is off. */
  inviteCode: string | null;
  counts: { today: number; backlog: number; forYou: number };
}

/** An invite addressed to the signed-in user, not yet accepted. */
export interface BoardInvite {
  id: string;
  boardId: string;
  boardName: string;
  memberCount: number;
  invitedBy: string;
}

/** What the join-link landing page shows. */
export interface BoardJoinPreview {
  boardId: string;
  boardName: string;
  invitedBy: string;
  /** Emails of the people already on the board. */
  members: string[];
  taskCount: number;
}

export interface NewBoardInput {
  name: string;
  shared: boolean;
  invites: string[];
}
