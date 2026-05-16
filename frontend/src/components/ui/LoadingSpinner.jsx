import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...', overlay = false }) => {
    const sizes = {
        small: { spinner: '20px', border: '2px' },
        medium: { spinner: '40px', border: '3px' },
        large: { spinner: '60px', border: '4px' }
    };
    
    const currentSize = sizes[size] || sizes.medium;
    
    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        },
        container: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '20px'
        },
        spinner: {
            width: currentSize.spinner,
            height: currentSize.spinner,
            border: `${currentSize.border} solid #f0f0f0`,
            borderTop: `${currentSize.border} solid #1976d2`,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
        },
        text: {
            color: '#666',
            fontSize: size === 'small' ? '12px' : size === 'large' ? '18px' : '14px',
            fontWeight: '500'
        }
    };
    
    const content = (
        <div style={styles.container}>
            <div style={styles.spinner}></div>
            {text && <div style={styles.text}>{text}</div>}
        </div>
    );
    
    if (overlay) {
        return (
            <div style={styles.overlay}>
                {content}
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }
    
    return (
        <>
            {content}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
};

export default LoadingSpinner;
