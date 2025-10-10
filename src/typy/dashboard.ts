export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  isPublic: boolean;
  size: string;
  layers: number;
  lastModified: string;
  owner: string;
  views?: number;
}

export interface UserStats {
  totalProjects: number;
  publicProjects: number;
  privateProjects: number;
  totalViews: number;
  storageUsed: number;
  storageLimit: number;
  layersCount: number;
  joinDate: string;
}

export interface SubscriptionInfo {
  plan: string;
  type: string;
  startDate: string;
  endDate: string;
  maxProjects: number;
  maxLayers: number;
  maxStorage: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  postalCode?: string;
  nip?: string;
  address?: string;
  companyName?: string;
  avatar?: string;
}

export interface NotificationSettings {
  newsletter: boolean;
  appNotifications: boolean;
  emailUpdates: boolean;
}

export interface ContactFormData {
  subject: string;
  name: string;
  email: string;
  message: string;
}