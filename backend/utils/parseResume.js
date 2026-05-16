const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');

/**
 * Extract text from resume file (PDF, DOC, DOCX)
 * @param {string} filePath - Path to the resume file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} Extracted text
 */
const extractResumeText = async (filePath, mimeType) => {
    try {
        const isRemote = typeof filePath === 'string' && /^https?:\/\//i.test(filePath);
        const fileExt = path.extname(filePath || '').toLowerCase();
        let buffer = null;

        if (isRemote) {
            const response = await axios.get(filePath, { responseType: 'arraybuffer', timeout: 15000 });
            buffer = Buffer.from(response.data);
        } else {
            if (!fs.existsSync(filePath)) {
                throw new Error('File not found');
            }
            buffer = fs.readFileSync(filePath);
        }

        // PDF file handling
        if (fileExt === '.pdf' || (mimeType && mimeType.includes('pdf'))) {
            const pdfData = await pdfParse(buffer);
            return pdfData.text || '';
        }

        // DOCX file handling
        if (fileExt === '.docx' || (mimeType && (mimeType.includes('word') || mimeType.includes('docx')))) {
            const result = await mammoth.extractRawText({ buffer });
            return result.value || '';
        }

        // DOC file handling (fallback with basic extraction)
        if (fileExt === '.doc') {
            // For .doc files, we'll attempt DOCX extraction as mammoth can handle some .doc files
            // If that fails, return a message to user
            try {
                const result = await mammoth.extractRawText({ buffer });
                if (result.value && result.value.trim().length > 0) {
                    return result.value;
                }
            } catch (e) {
                console.log('Could not parse .doc file with mammoth, returning placeholder');
            }
            return `Unable to fully parse .doc file: ${path.basename(filePath)}. Please convert to DOCX or PDF.`;
        }

        throw new Error(`Unsupported file type: ${fileExt}`);
    } catch (error) {
        console.error('Error extracting resume text:', error.message);
        throw error;
    }
};

module.exports = {
    extractResumeText
};
