import React from 'react';
interface ReviewModalProps {
    isOpen: boolean;
    venueId: string;
    venueName: string;
    onClose: () => void;
    onSuccess: () => void;
}
export declare const ReviewModal: React.FC<ReviewModalProps>;
export {};
