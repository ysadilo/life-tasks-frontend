import type { TFunction } from 'i18next';
import type { BoardMember } from '../../models';

/** "You" for the signed-in member, else the local part of their email. */
export function memberLabel(member: BoardMember, t: TFunction): string {
  return member.isMe ? t('board.you') : member.email.split('@')[0];
}
