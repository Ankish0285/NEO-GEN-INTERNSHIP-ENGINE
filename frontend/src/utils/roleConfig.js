import { 
    LayoutDashboard, 
    User, 
    FileText, 
    Briefcase, 
    ThumbsUp, 
    BarChart2, 
    Settings, 
    Users, 
    PlusCircle,
    Star
} from 'lucide-react';

export const roleConfig = {
    student: {
        basePath: '/dashboard',
        menuItems: [
            { path: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
            { path: '/dashboard/profile', label: 'Profile', icon: User },
            { path: '/dashboard/ats-resume', label: 'ATS Resume', icon: FileText },
            { path: '/dashboard/applications', label: 'Applications', icon: Briefcase },
            { path: '/dashboard/recommendations', label: 'Recommendations', icon: ThumbsUp },
            { path: '/dashboard/success-stories', label: 'Success Stories', icon: Star },
            { path: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
            { path: '/dashboard/settings', label: 'Settings', icon: Settings },
        ]
    },
    admin: {
        basePath: '/admin/dashboard',
        menuItems: [
            { path: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
            { path: '/admin/dashboard/profile', label: 'Profile', icon: User },
            { path: '/admin/dashboard/users', label: 'Users', icon: Users },
            { path: '/admin/dashboard/internships', label: 'Internships', icon: Briefcase },
            { path: '/admin/dashboard/applications', label: 'Applications', icon: FileText },
            { path: '/admin/dashboard/success-stories', label: 'Success Stories', icon: Star },
            { path: '/admin/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
            { path: '/admin/dashboard/settings', label: 'Settings', icon: Settings },
        ]
    },
    partner: {
        basePath: '/partner/dashboard',
        menuItems: [
            { path: '/partner/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
            { path: '/partner/dashboard/profile', label: 'Profile', icon: User },
            { path: '/partner/dashboard/post-internship', label: 'Post Internship', icon: PlusCircle },
            { path: '/partner/dashboard/applications', label: 'Applications', icon: Briefcase },
            { path: '/partner/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
            { path: '/partner/dashboard/settings', label: 'Settings', icon: Settings },
        ]
    }
};

export const getRoleFromPath = (pathname) => {
    if (pathname.startsWith('/admin')) return 'admin';
    if (pathname.startsWith('/partner')) return 'partner';
    return 'student';
};

// Role-based redirect paths after login
export const getRoleBasedRedirect = (role) => {
    switch (role) {
        case 'admin':
            return '/admin/dashboard';
        case 'partner':
            return '/partner/dashboard';
        case 'student':
        default:
            return '/dashboard';
    }
};

// Get login redirect URL
export const getLoginPath = () => '/login';
