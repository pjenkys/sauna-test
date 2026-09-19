import React from 'react';
interface ClaimModalProps {
    isOpen: boolean;
    venueId: string;
    venueName: string;
    onClose: () => void;
}
export declare const ClaimModal: React.FC<ClaimModalProps>;
export {};
