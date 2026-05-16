// Validation utility functions

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePhone = (phone) => {
    // Indian phone number validation (10 digits)
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
};

const validatePassword = (password) => {
    // At least 6 characters, contains letter and number
    return password.length >= 6 && /[a-zA-Z]/.test(password) && /\d/.test(password);
};

const validateProfileData = (data) => {
    const errors = [];
    
    if (data.name && data.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    
    if (data.email && !validateEmail(data.email)) {
        errors.push('Invalid email format');
    }
    
    // Only validate phone if it's provided and not empty
    if (data.phone && data.phone.trim() && !validatePhone(data.phone)) {
        errors.push('Invalid phone number. Must be a valid 10-digit Indian number');
    }
    
    if (data.university && data.university.trim().length < 3) {
        errors.push('University name must be at least 3 characters long');
    }
    
    if (data.course && data.course.trim().length < 2) {
        errors.push('Course name must be at least 2 characters long');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

const validateInternshipData = (data) => {
    const errors = [];
    const requiredFields = ['title', 'organization', 'department', 'duration', 'stipend', 'location', 'eligibility', 'deadline', 'description', 'fields', 'applyLink'];
    
    requiredFields.forEach(field => {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim().length === 0)) {
            errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
    });
    
    if (data.fields && (!Array.isArray(data.fields) || data.fields.length === 0)) {
        errors.push('At least one field/category is required');
    }
    
    if (data.deadline) {
        const deadline = new Date(data.deadline);
        const now = new Date();
        if (deadline < now) {
            errors.push('Deadline must be a future date');
        }
    }
    
    if (data.applyLink && !data.applyLink.startsWith('http')) {
        errors.push('Apply link must be a valid URL');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

const validateApplicationData = (data) => {
    const errors = [];
    
    if (!data.internshipId) {
        errors.push('Internship ID is required');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    return input
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '');
};

module.exports = {
    validateEmail,
    validatePhone,
    validatePassword,
    validateProfileData,
    validateInternshipData,
    validateApplicationData,
    sanitizeInput
};
