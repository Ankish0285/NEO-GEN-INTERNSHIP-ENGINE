const asyncHandler = require('express-async-handler');
const Resume = require('../models/Resume');
const Internship = require('../models/Internship');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { extractResumeText } = require('../utils/parseResume');
const { calculateATSScore, generateSuggestions, extractResumeInfo } = require('../utils/atsScoring');
const cloudinary = require('../config/cloudinary');

// @desc    Upload resume and analyze with ATS
// @route   POST /api/resume/upload
// @access  Private
const uploadResume = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    try {
        // Extract text from resume file
        let parsedText = '';
        try {
            parsedText = await extractResumeText(req.file.path, req.file.mimetype);
        } catch (extractError) {
            console.error('Error extracting resume text:', extractError);
            res.status(400);
            throw new Error(`Unable to parse resume file: ${extractError.message}`);
        }

        // Ensure we have text
        if (!parsedText || parsedText.trim().length < 10) {
            res.status(400);
            throw new Error('Resume is too short or could not be parsed. Please ensure it has substantial content.');
        }

        console.log('Parsed resume text length:', parsedText.length);

        // Upload to Cloudinary manually
        let uploadResult;
        try {
            uploadResult = await cloudinary.uploader.upload(req.file.path, {
                resource_type: "auto",
                folder: "resumes",
            });
        } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            res.status(500);
            throw new Error(`Cloudinary upload failed: ${uploadError.message}`);
        }
        
        // Clean up the local file created by multer.diskStorage
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        const secureUrl = uploadResult.secure_url;

        // Calculate ATS score (ML-based with Rule-based fallback)
        let scoreData;
        let suggestions = [];
        
        try {
            // Provide default job description if not provided
            const jobDesc = req.body.jobDescription && req.body.jobDescription.trim() !== '' 
                ? req.body.jobDescription 
                : 'software engineer job requiring technical skills programming experience project management';

            console.log('Calling ML service with jobDesc length:', jobDesc.length);
            
            // Call ATS Django API using resumeUrl for server-side download
            const atsBase = process.env.ATS_API_URL || 'http://localhost:8000';
            const mlResponse = await axios.post(`${atsBase.replace(/\/+$/, '')}/ats/score`, {
                resumeUrl: secureUrl,
                jobDescription: jobDesc
            }, { timeout: 15000 });

            const mlData = mlResponse.data;
            console.log('ML response received:', { ats_score: mlData.ats_score, matched_count: mlData.matched_skills?.length, missing_count: mlData.missing_skills?.length });
            
            const mlScore = Math.round(mlData.ats_score || 0);
            console.log('Calculated mlScore:', mlScore);

            // Construct scoreData from ML response
            scoreData = {
                score: mlScore,
                matched: mlData.matched_skills || [],
                missing: mlData.missing_skills || [],
                breakdown: {
                    technical: mlScore,
                    softSkills: Math.max(mlScore - 5, 0),
                    experience: Math.max(mlScore - 10, 0),
                    education: 90, // Assume decent if parsed
                    formatting: 95,
                    contact: 100,
                    completeness: 85
                },
                sections: {
                    hasSummary: true, 
                    hasExperience: true,
                    hasEducation: true,
                    hasSkills: true,
                    hasProjects: true,
                    hasContact: true
                },
                wordCount: parsedText.split(/\s+/).length
            };
            
            suggestions = mlData.improvement_tips || [];

        } catch (mlError) {
            console.error('ML Service Error (using fallback):', mlError.message);
            // Fallback to rule-based logic
            scoreData = calculateATSScore(parsedText);
            suggestions = generateSuggestions(scoreData);
        }
        
        // If ML suggestions are empty, generate rule-based ones
        if (suggestions.length === 0) {
            suggestions = generateSuggestions(scoreData);
        }

        // Extract resume information (Contact info, etc.)
        const resumeInfo = extractResumeInfo(parsedText);

        // Update user skills with matched keywords
        if (resumeInfo.skills && resumeInfo.skills.length > 0) {
            await User.findByIdAndUpdate(req.user.id, {
                $addToSet: { skills: { $each: resumeInfo.skills } }
            });
        }

        // Save resume to database
        const resume = await Resume.create({
            user: req.user.id,
            fileName: req.file.originalname,
            fileUrl: secureUrl,
            parsedText: parsedText,
            atsScore: scoreData.score,
            keywordsMatched: scoreData.matched.slice(0, 20), // Store top 20
            missingKeywords: scoreData.missing,
            breakdown: scoreData.breakdown,
            sections: scoreData.sections,
            suggestions,
            extractedSkills: resumeInfo.skills,
            wordCount: scoreData.wordCount
        });

        // Update user with resume status and ATS score
        await User.findByIdAndUpdate(req.user.id, {
            resumeUploaded: true,
            atsScore: scoreData.score
        });

        // Log activity
        await ActivityLog.create({
            user: req.user.id,
            action: 'Uploaded Resume',
            details: { 
                fileName: req.file.originalname, 
                score: scoreData.score,
                wordCount: scoreData.wordCount
            },
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Prepare response with structured fields
        const response = {
            success: true,
            message: 'Resume uploaded and analyzed successfully',
            resumeId: resume._id,
            resumeUploaded: true,
            atsScore: scoreData.score,
            // Overall and category scores for easy frontend binding
            overallScore: scoreData.score,
            technical: scoreData.breakdown.technical,
            softSkills: scoreData.breakdown.softSkills,
            experience: scoreData.breakdown.experience,
            education: scoreData.breakdown.education,
            formatting: scoreData.breakdown.formatting,
            contact: scoreData.breakdown.contact,
            completeness: scoreData.breakdown.completeness,
            // Backward-compatible fields
            score: scoreData.score,
            breakdown: scoreData.breakdown,
            suggestions,
            matchedKeywords: scoreData.matched.slice(0, 15),
            missingKeywords: scoreData.missing.slice(0, 10),
            sections: scoreData.sections,
            contactInfo: {
                email: resumeInfo.email,
                phone: resumeInfo.phone,
                linkedin: resumeInfo.linkedin,
                github: resumeInfo.github
            },
            extractedSkills: resumeInfo.skills.slice(0, 20),
            wordCount: scoreData.wordCount,
            fileName: req.file.originalname,
            fileUrl: secureUrl, // Return the file path/URL for frontend usage
            secure_url: secureUrl // Explicitly return secure_url as requested
        };

        res.status(201).json(response);
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        throw error;
    }
});

// @desc    Get latest resume score and analysis
// @route   GET /api/resume/score
// @access  Private
const getResumeScore = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    const resume = await Resume.findOne({ user: req.user.id }).sort({ createdAt: -1 });

    if (resume) {
        // Return stored analysis (include structured fields)
        const response = {
            success: true,
            resumeId: resume._id,
            resumeUploaded: true,
            atsScore: resume.atsScore,
            // Structured fields
            overallScore: resume.atsScore,
            technical: resume.breakdown?.technical ?? 0,
            softSkills: resume.breakdown?.softSkills ?? 0,
            experience: resume.breakdown?.experience ?? 0,
            education: resume.breakdown?.education ?? 0,
            formatting: resume.breakdown?.formatting ?? 0,
            contact: resume.breakdown?.contact ?? 0,
            completeness: resume.breakdown?.completeness ?? 0,
            // Backward-compatible
            score: resume.atsScore,
            breakdown: resume.breakdown,
            suggestions: resume.suggestions,
            matchedKeywords: resume.keywordsMatched.slice(0, 15),
            missingKeywords: resume.missingKeywords.slice(0, 10),
            sections: resume.sections,
            extractedSkills: resume.extractedSkills,
            wordCount: resume.wordCount,
            fileName: resume.fileName,
            uploadedAt: resume.createdAt
        };
        res.json(response);
    } else {
        // No resume uploaded yet - return status without demo data
        res.json({
            success: true,
            resumeUploaded: false,
            atsScore: 0,
            score: 0,
            message: 'No resume uploaded yet',
            breakdown: {
                technical: 0,
                softSkills: 0,
                experience: 0,
                education: 0,
                completeness: 0,
                formatting: 0,
                contact: 0
            },
            suggestions: [],
            sections: {
                hasSummary: false,
                hasExperience: false,
                hasEducation: false,
                hasSkills: false,
                hasProjects: false,
                hasContact: false
            }
        });
    }
});

// @desc    Get ATS-based internship recommendations
// @route   GET /api/resume/recommendations
// @access  Private
const getRecommendations = asyncHandler(async (req, res) => {
    const resume = await Resume.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    const user = await User.findById(req.user.id);

    let recommendations = [];

    if (resume && resume.extractedSkills && resume.extractedSkills.length > 0) {
        // Search internships where required skills match extracted resume skills
        const matchedInternships = await Internship.find({
            $and: [
                { requiredSkills: { $in: resume.extractedSkills } },
                { status: 'active' },
                { $or: [
                    { 'applicationDeadline': { $gte: new Date() } },
                    { 'applicationDeadline': null }
                ]}
            ]
        }).limit(10);

        // Score each internship based on skill match and ATS score
        recommendations = matchedInternships.map(internship => {
            const matchedSkills = internship.requiredSkills.filter(skill =>
                resume.extractedSkills.some(resSkill => 
                    resSkill.toLowerCase().includes(skill.toLowerCase()) ||
                    skill.toLowerCase().includes(resSkill.toLowerCase())
                )
            );

            const matchPercentage = (matchedSkills.length / (internship.requiredSkills.length || 1)) * 100;
            const relevanceScore = Math.round((matchPercentage * 0.6) + (resume.atsScore * 0.4));

            return {
                id: internship._id,
                title: internship.title,
                company: internship.company,
                position: internship.position,
                location: internship.location,
                stipend: internship.stipend,
                duration: internship.duration,
                description: internship.description,
                requiredSkills: internship.requiredSkills,
                matchedSkills,
                matchPercentage: Math.round(matchPercentage),
                relevanceScore,
                applicationDeadline: internship.applicationDeadline
            };
        }).sort((a, b) => b.relevanceScore - a.relevanceScore);
    } else if (user && user.skills && user.skills.length > 0) {
        // Fallback: use user profile skills if resume not available
        const matchedInternships = await Internship.find({
            $and: [
                { requiredSkills: { $in: user.skills } },
                { status: 'active' },
                { $or: [
                    { 'applicationDeadline': { $gte: new Date() } },
                    { 'applicationDeadline': null }
                ]}
            ]
        }).limit(10);

        recommendations = matchedInternships.map(internship => {
            const matchedSkills = internship.requiredSkills.filter(skill =>
                user.skills.some(userSkill => 
                    userSkill.toLowerCase().includes(skill.toLowerCase()) ||
                    skill.toLowerCase().includes(userSkill.toLowerCase())
                )
            );

            const matchPercentage = (matchedSkills.length / (internship.requiredSkills.length || 1)) * 100;
            const relevanceScore = Math.round(matchPercentage);

            return {
                id: internship._id,
                title: internship.title,
                company: internship.company,
                position: internship.position,
                location: internship.location,
                stipend: internship.stipend,
                duration: internship.duration,
                description: internship.description,
                requiredSkills: internship.requiredSkills,
                matchedSkills,
                matchPercentage: Math.round(matchPercentage),
                relevanceScore
            };
        }).sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    res.json({
        success: true,
        count: recommendations.length,
        recommendations,
        message: recommendations.length > 0 
            ? `Found ${recommendations.length} internships matching your profile`
            : 'Upload your resume or add skills to get personalized recommendations'
    });
});

// @desc    Delete resume
// @route   DELETE /api/resume/:resumeId
// @access  Private
const deleteResume = asyncHandler(async (req, res) => {
    const resume = await Resume.findById(req.params.resumeId);

    if (!resume) {
        res.status(404);
        throw new Error('Resume not found');
    }

    // Verify ownership
    if (resume.user.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to delete this resume');
    }

    // Delete file from disk only if it's local (Cloudinary keeps files or handles separately)
    if (!resume.fileUrl || !resume.fileUrl.startsWith('http')) {
        const filePath = path.join(__dirname, '../uploads/', resume.fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    // Delete from database
    await Resume.findByIdAndDelete(req.params.resumeId);

    // Log activity
    await ActivityLog.create({
        user: req.user.id,
        action: 'Deleted Resume',
        details: { fileName: resume.fileName },
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    res.json({ 
        success: true, 
        message: 'Resume deleted successfully' 
    });
});

module.exports = {
    uploadResume,
    getResumeScore,
    getRecommendations,
    deleteResume
};
