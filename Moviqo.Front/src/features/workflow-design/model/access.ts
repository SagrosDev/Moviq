export const canCreateWorkflow = (role: string) =>
  ["owner", "administrator", "designer"].includes(role);
