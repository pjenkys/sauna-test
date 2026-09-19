import React from 'react';
import { User } from '../types';
interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (credentials: {
        email: string;
        password: string;
    }) => Promise<void>;
    register: (data: {
        email: string;
        password: string;
        display_name: string;
    }) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}
export declare const AuthProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useAuth: () => AuthContextType;
export {};
