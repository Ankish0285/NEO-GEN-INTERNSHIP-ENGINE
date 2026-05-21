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
    Star,
    Globe2,
    Brain
} from 'lucide-react';

export const roleConfig = {
    student: {
        basePath: '/dashboard',
        panelTitle: 'Student Dashboard',
        panelBadge: 'Student',
        accentClass: 'from-saffron to-[#ffad5c]',
        badgeClass: 'bg-saffron/15 text-saffron border-saffron/30',
        menuItems: [
            { path: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
            { path: '/dashboard/profile', label: 'Profile', icon: User },
            { path: '/dashboard/ats-resume', label: 'ATS Resume', icon: FileText },
            { path: '/dashboard/ai-intelligence', label: 'AI Intelligence', icon: Brain },
            { path: '/dashboard/applications', label: 'Applications', icon: Briefcase },
            { path: '/dashboard/recommendations', label: 'Recommendations', icon: ThumbsUp },
            { path: '/dashboard/success-stories', label: 'Success Stories', icon: Star },
            { path: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
            { path: '/dashboard/settings', label: 'Settings', icon: Settings },
        ]
    },
    admin: {
        basePath: '/admin/dashboard',
        panelTitle: 'Super Admin',
        panelBadge: 'Super Admin',
        accentClass: 'from-[#FF9933] to-[#ffb347]',
        badgeClass: 'admin-topbar__badge',
        loginPath: '/admin/login',
        menuItems: [
            { path: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
            { path: '/admin/dashboard/profile', label: 'Profile', icon: User },
            { path: '/admin/dashboard/website', label: 'Website Control', icon: Globe2 },
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
        panelTitle: 'Partner Portal',
        panelBadge: 'Partner',
        accentClass: 'from-amber-500 to-orange-600',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
        loginPath: '/partner/login',
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

export const getLoginPath = (role) => roleConfig[role]?.loginPath || '/login';
