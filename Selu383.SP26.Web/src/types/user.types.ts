export type UserSession = {
  id: number;
  userName: string;
  email: string;
  phoneNumber: string;
  roles: string[];
  points: number;
  displayName: string;
  birthday?: string | null;
  profilePictureUrl: string;
};
