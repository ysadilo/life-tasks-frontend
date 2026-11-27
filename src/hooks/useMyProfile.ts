import { useAuth0 } from '@auth0/auth0-react';
import { useTranslation } from 'react-i18next';
import { imageUrl } from '../lib/images';
import { useMyAvatarKey } from './useBoards';

/** The signed-in user's name and avatar photo (uploaded one first, then the sign-in provider's). */
export function useMyProfile() {
  const { t } = useTranslation();
  const { user } = useAuth0();
  const avatarKey = useMyAvatarKey();
  return {
    displayName: user?.given_name ?? user?.nickname ?? user?.name ?? user?.email ?? t('user.defaultName'),
    avatarSrc: avatarKey ? imageUrl(avatarKey) : user?.picture,
  };
}
