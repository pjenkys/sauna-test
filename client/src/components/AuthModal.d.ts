import React from 'react';
interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'register';
}
export declare const AuthModal: React.FC<AuthModalProps>;
export {};
