import { invitationsApi } from './api/docsy';

const pendingInvitationTokenKey = 'pendingInvitationToken';

export const getPendingInvitationToken = () => localStorage.getItem(pendingInvitationTokenKey);

export const setPendingInvitationToken = (token: string) => {
  localStorage.setItem(pendingInvitationTokenKey, token);
};

export const clearPendingInvitationToken = () => {
  localStorage.removeItem(pendingInvitationTokenKey);
};

export const acceptPendingInvitation = async () => {
  const token = getPendingInvitationToken();

  if (!token) {
    return false;
  }

  await invitationsApi.accept(token);
  clearPendingInvitationToken();
  return true;
};
