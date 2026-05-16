// Frontend validation utilities

export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
        isValid: emailRegex.test(email),
        message: emailRegex.test(email) ? '' : 'Please enter a valid email address'
    };
};

export const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    return {
        isValid: phoneRegex.test(cleanPhone),
        message: phoneRegex.test(cleanPhone) ? '' : 'Please enter a valid 10-digit phone number'
    };
};

export const validatePassword = (password) => {
    const hasMinLength = password.length >= 6;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!hasMinLength) {
        return { isValid: false, message: 'Password must be at least 6 characters long' };
    }
    if (!hasLetter) {
        return { isValid: false, message: 'Password must contain at least one letter' };
    }
    if (!hasNumber) {
        return { isValid: false, message: 'Password must contain at least one number' };
    }
    
    return { isValid: true, message: '' };
};

export const validateName = (name) => {
    const isValid = name && name.trim().length >= 2;
    return {
        isValid,
        message: isValid ? '' : 'Name must be at least 2 characters long'
    };
};

export const validateUniversity = (university) => {
    const isValid = university && university.trim().length >= 3;
    return {
        isValid,
        message: isValid ? '' : 'University name must be at least 3 characters long'
    };
};

export const validateCourse = (course) => {
    const isValid = course && course.trim().length >= 2;
    return {
        isValid,
        message: isValid ? '' : 'Course name must be at least 2 characters long'
    };
};

export const validateSkills = (skills) => {
    const isValid = Array.isArray(skills) && skills.length > 0;
    return {
        isValid,
        message: isValid ? '' : 'Please add at least one skill'
    };
};

export const validateFileSize = (file, maxSizeMB = 5) => {
    if (!file) return { isValid: false, message: 'Please select a file' };
    
    const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
    const isValid = file.size <= maxSize;
    
    return {
        isValid,
        message: isValid ? '' : `File size must be less than ${maxSizeMB}MB`
    };
};

export const validateFileType = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']) => {
    if (!file) return { isValid: false, message: 'Please select a file' };
    
    const isValid = allowedTypes.includes(file.type);
    const typeNames = allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');
    
    return {
        isValid,
        message: isValid ? '' : `File must be one of: ${typeNames}`
    };
};

export const validateResumeFile = (file) => {
    if (!file) return { isValid: false, message: 'Please select a resume file' };
    
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
        return { isValid: false, message: 'Resume must be PDF, DOC, or DOCX format' };
    }
    
    if (file.size > maxSize) {
        return { isValid: false, message: 'Resume file size must be less than 5MB' };
    }
    
    return { isValid: true, message: '' };
};

export const validateProfileData = (data) => {
    const errors = {};
    
    if (data.name !== undefined) {
        const nameValidation = validateName(data.name);
        if (!nameValidation.isValid) errors.name = nameValidation.message;
    }
    
    if (data.email !== undefined) {
        const emailValidation = validateEmail(data.email);
        if (!emailValidation.isValid) errors.email = emailValidation.message;
    }
    
    if (data.phone !== undefined && data.phone !== '') {
        const phoneValidation = validatePhone(data.phone);
        if (!phoneValidation.isValid) errors.phone = phoneValidation.message;
    }
    
    if (data.university !== undefined && data.university !== '') {
        const universityValidation = validateUniversity(data.university);
        if (!universityValidation.isValid) errors.university = universityValidation.message;
    }
    
    if (data.course !== undefined && data.course !== '') {
        const courseValidation = validateCourse(data.course);
        if (!courseValidation.isValid) errors.course = courseValidation.message;
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export const formatErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    
    if (error.response?.data?.message) return error.response.data.message;
    if (error.data?.message) return error.data.message;
    if (error.message) return error.message;
    
    return 'An unexpected error occurred. Please try again.';
};

export const showValidationError = (fieldName, errorMessage) => {
    return {
        field: fieldName,
        message: errorMessage,
        timestamp: Date.now()
    };
};
