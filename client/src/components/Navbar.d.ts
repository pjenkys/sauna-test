import React from 'react';
interface NavbarProps {
    currentPath: string;
    navigate: (path: string) => void;
}
export declare const Navbar: React.FC<NavbarProps>;
export {};
