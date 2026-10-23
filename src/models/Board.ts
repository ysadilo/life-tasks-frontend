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
}

/** An invite addressed to the signed-in user, not yet accepted. */
export interface BoardInvite {
  id: string;
  boardId: string;
  boardName: string;
  memberCount: number;
  invitedBy: string;
}

export interface NewBoardInput {
  name: string;
  shared: boolean;
  invites: string[];
}
