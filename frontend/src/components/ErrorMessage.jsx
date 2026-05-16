import React from 'react';

const ErrorMessage = ({ message, type = 'error', onClose }) => {
    if (!message) return null;
    
    const styles = {
        container: {
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'slideDown 0.3s ease',
            fontSize: '14px',
            lineHeight: '1.5'
        },
        error: {
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            color: '#c33'
        },
        success: {
            backgroundColor: '#efe',
            border: '1px solid #cfc',
            color: '#3c3'
        },
        warning: {
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            color: '#856404'
        },
        info: {
            backgroundColor: '#e3f2fd',
            border: '1px solid #90caf9',
            color: '#1565c0'
        },
        closeButton: {
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            marginLeft: '12px',
            padding: '0',
            opacity: 0.7,
            transition: 'opacity 0.2s'
        }
    };
    
    const getIcon = () => {
        switch(type) {
            case 'success': return '✓';
            case 'warning': return '⚠';
            case 'info': return 'ℹ';
            case 'error':
            default: return '⚠️';
        }
    };
    
    const containerStyle = {
        ...styles.container,
        ...(type === 'error' ? styles.error : 
            type === 'success' ? styles.success : 
            type === 'warning' ? styles.warning : 
            styles.info)
    };
    
    return (
        <div style={containerStyle}>
            <span>
                <strong>{getIcon()}</strong> {message}
            </span>
            {onClose && (
                <button 
                    style={styles.closeButton}
                    onClick={onClose}
                    onMouseEnter={(e) => e.target.style.opacity = '1'}
                    onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                    aria-label="Close message"
                >
                    ×
                </button>
            )}
        </div>
    );
};

export default ErrorMessage;
