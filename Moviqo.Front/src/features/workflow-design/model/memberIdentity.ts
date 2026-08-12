export const formatWorkflowMemberIdentity = (
  displayName: string,
  email: string,
  membershipId: string
) => {
  const normalizedName = displayName.trim();
  const normalizedEmail = email.trim();
  if (!normalizedEmail) return normalizedName || membershipId;
  return !normalizedName || normalizedName.toLowerCase() === normalizedEmail.toLowerCase()
    ? normalizedEmail
    : `${normalizedName} (${normalizedEmail})`;
};
