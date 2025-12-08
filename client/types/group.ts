export interface GroupMember {
  userId?: string;
  email?: string;
  name?: string;
}

export interface Group {
  id: string;
  _id: string;
  name: string;
  slug?: string;
  description?: string | null;
  members?: GroupMember[];
  createdAt?: string;
  updatedAt?: string;
}
