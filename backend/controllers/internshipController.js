const asyncHandler = require('express-async-handler');
const Internship = require('../models/Internship');
const User = require('../models/User');
const Resume = require('../models/Resume');
const { createAndNotify } = require('../utils/notificationHelper');

// @desc    Get recommended internships based on user profile/resume
// @route   GET /api/internships/recommended
// @access  Private
const getRecommendedInternships = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    const resume = await Resume.findOne({ user: req.user.id }).sort({ createdAt: -1 });

    let userSkills = user.skills || [];
    
    // Merge skills from resume if available to improve recommendation
    if (resume && resume.extractedSkills) {
        // Simple deduplication
        const skillSet = new Set(userSkills.map(s => s.toLowerCase()));
        resume.extractedSkills.forEach(s => {
            if (!skillSet.has(s.toLowerCase())) {
                userSkills.push(s);
            }
        });
    }

    // Normalize user skills to lowercase for comparison
    const normalizedUserSkills = userSkills.map(s => s.toLowerCase());

    // Get all active internships
    const internships = await Internship.find({ status: 'active' }).lean();

    // Calculate score for each internship
    const scoredInternships = internships.map(internship => {
        let score = 0;
        let matchedSkills = [];

        // 1. Skill Matching (Highest Weight)
        // Check if internship required skills match user skills
        if (internship.skills && Array.isArray(internship.skills)) {
             internship.skills.forEach(skill => {
                const skillLower = skill.toLowerCase();
                // Check for partial matches (e.g., "React" matches "React.js")
                const isMatch = normalizedUserSkills.some(userSkill => 
                    userSkill.includes(skillLower) || skillLower.includes(userSkill)
                );
                
                if (isMatch) {
                    score += 10;
                    matchedSkills.push(skill);
                }
             });
        }

        // 2. Location Matching
        if (user.preferredLocation && internship.location && 
            (internship.location.toLowerCase().includes(user.preferredLocation.toLowerCase()) || 
             user.preferredLocation.toLowerCase().includes(internship.location.toLowerCase()) ||
             internship.location.toLowerCase() === 'remote')) {
            score += 5;
        }
        
        // 3. Title/Department Relevance
        if (user.course) {
             const courseLower = user.course.toLowerCase();
             if (internship.title.toLowerCase().includes(courseLower) || 
                 internship.department.toLowerCase().includes(courseLower)) {
                 score += 5;
             }
        }

        return { 
            ...internship, 
            matchScore: score, 
            matchedSkills,
            matchPercentage: Math.min(100, Math.round((score / 30) * 100)) // Approximate percentage
        };
    });

    // Sort by score descending
    scoredInternships.sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json(scoredInternships);
});

// @desc    Get all internships
// @route   GET /api/internships
// @access  Public
const getInternships = asyncHandler(async (req, res) => {
    const internships = await Internship.find({ status: 'active' }).lean();
    res.status(200).json(internships);
});

// @desc    Get single internship by ID
// @route   GET /api/internships/:id
// @access  Public
const getInternshipById = asyncHandler(async (req, res) => {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
        res.status(404);
        throw new Error('Internship not found');
    }

    res.status(200).json(internship);
});

// @desc    Create new internship
// @route   POST /api/internships
// @access  Private
const createInternship = asyncHandler(async (req, res) => {
    if (!req.user || !['partner', 'admin', 'super_admin'].includes(req.user.role)) {
        res.status(403);
        throw new Error('Forbidden - Only partners and super admins can post internships');
    }

    req.body.createdBy = req.user.id;
    // Set to active so it immediately appears on the webpage
    req.body.status = 'active';
    const internship = await Internship.create(req.body);

    // Notify users about new internship
    await createAndNotify(req.app, {
        title: 'New Internship Opportunity',
        message: `${internship.organization} has posted a new internship: ${internship.title}`,
        type: 'new',
        priority: 'medium',
        link: `/internships/${internship._id}`
    });

    res.status(201).json(internship);
});

// @desc    Update internship
// @route   PUT /api/internships/:id
// @access  Private (Super Admin: any internship, Partner: own internship only)
const updateInternship = asyncHandler(async (req, res) => {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
        res.status(404);
        throw new Error('Internship not found');
    }

    // ===== AUTHORIZATION =====
    const role = req.user.role;
    const userId = req.user._id.toString();
    const ownerId = internship.createdBy ? internship.createdBy.toString() : null;

    let authorized = false;
    if (role === 'super_admin' || role === 'admin') {
        authorized = true;
    } else if (role === 'partner') {
        authorized = ownerId === userId;
    }

    if (!authorized) {
        if (role === 'partner') {
            res.status(403);
            throw new Error('Forbidden - You can only edit internships posted by your organization');
        }
        res.status(403);
        throw new Error('Forbidden - You are not allowed to edit this internship');
    }

    // ===== FIELD SANITIZATION =====
    // Only allow non-administrative, legitimate editable fields through.
    // Role-based safety: partners/super admin cannot escalate privileges via update.
    const ALLOWED_FIELDS = [
        'title',
        'organization',
        'department',
        'duration',
        'stipend',
        'location',
        'eligibility',
        'deadline',
        'description',
        'skills',
        'requiredSkills',
        'preferredSkills',
        'degreeRequirements',
        'branchRequirements',
        'yearRequirements',
        'experienceRequirements',
        'eligibilityConditions',
        'applyLink',
        'type',
        'workMode',
        'startDate',
        'openings',
        'benefits',
        'requirements',
        'responsibilities'
    ];

    // Super admin / admin can also update status. Partner cannot arbitrarily approve.
    if (role === 'super_admin' || role === 'admin') {
        ALLOWED_FIELDS.push('status');
    }

    const sanitized = {};
    for (const field of ALLOWED_FIELDS) {
        if (req.body[field] !== undefined) {
            sanitized[field] = req.body[field];
        }
    }

    const updatedInternship = await Internship.findByIdAndUpdate(
        req.params.id,
        sanitized,
        {
            new: true,
            runValidators: true,
            context: 'query'
        }
    );

    // Notify users about update
    try {
        await createAndNotify(req.app, {
            title: 'Internship Updated',
            message: `The internship "${internship.title}" at ${internship.organization} has been updated.`,
            type: 'recurring',
            priority: 'low',
            link: `/internships/${internship._id}`
        });
    } catch (notifyErr) {
        console.warn('[Internship] Notification skipped:', notifyErr.message);
    }

    res.status(200).json({
        success: true,
        message: 'Internship updated successfully',
        data: updatedInternship
    });
});

// @desc    Delete internship
// @route   DELETE /api/internships/:id
// @access  Private/Admin
const deleteInternship = asyncHandler(async (req, res) => {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
        res.status(404);
        throw new Error('Internship not found');
    }

    await internship.deleteOne();

    res.status(200).json({ id: req.params.id });
});

// @desc    Get ALL internships for admin (including pending)
// @route   GET /api/internships/admin/all
// @access  Private/Admin
const getAdminInternships = asyncHandler(async (req, res) => {
    const internships = await Internship.find({}).sort({ createdAt: -1 }).lean();
    res.status(200).json(internships);
});

// @desc    Approve internship
// @route   PUT /api/internships/:id/approve
// @access  Private/Admin
const approveInternship = asyncHandler(async (req, res) => {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
        res.status(404);
        throw new Error('Internship not found');
    }

    internship.status = 'active';
    await internship.save();

    // Notify users about approval
    await createAndNotify(req.app, {
        title: 'New Internship Approved',
        message: `A new internship "${internship.title}" at ${internship.organization} is now open for applications.`,
        type: 'new',
        priority: 'high',
        link: `/internships/${internship._id}`
    });

    res.status(200).json({ message: 'Internship approved successfully', internship });
});

module.exports = {
    getInternships,
    getInternshipById,
    createInternship,
    updateInternship,
    deleteInternship,
    getRecommendedInternships,
    getAdminInternships,
    approveInternship
};
