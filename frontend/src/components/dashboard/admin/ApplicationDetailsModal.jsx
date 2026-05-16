import React from 'react';
import { resolveResumeUrl } from '../../../utils/resolveResumeUrl';
import Modal from '../../ui/Modal';
import { 
  User, Mail, Phone, BookOpen, GraduationCap, 
  FileText, ExternalLink, Calendar, MapPin, Building,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

const ApplicationDetailsModal = ({ isOpen, onClose, application, isLoading }) => {
  if (!isOpen) return null;

  // 1. Loading State
  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Application Details" className="max-w-2xl">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Loading application details...</p>
        </div>
      </Modal>
    );
  }

  // 2. Error/Empty State
  if (!application) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Application Details" className="max-w-2xl">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle size={48} className="text-red-400 mb-4" />
          <h3 className="text-lg font-bold text-gray-900">Failed to load application</h3>
          <p className="text-gray-500 mt-2">The application data could not be retrieved.</p>
          <button 
            onClick={onClose}
            className="mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  // 3. Data Extraction & Validation
  // Prioritize 'details' object (snapshot), fallback to 'student' object (live user data)
  const studentInfo = {
    name: application.details?.fullName || application.student?.name || 'N/A',
    email: application.details?.email || application.student?.email || 'N/A',
    phone: application.details?.phone || application.student?.phone || 'N/A',
    college: application.details?.college || application.student?.university || 'N/A', // Mapped 'university' to 'college'
    course: application.details?.course || application.student?.course || 'N/A',
    year: application.details?.year || 'N/A',
  };

  const internshipInfo = {
    title: application.internship?.title || 'Unknown Role',
    organization: application.internship?.organization || 'Unknown Organization',
    applyLink: application.internship?.applyLink || null,
  };

  const resumeUrl = application.resume || application.details?.resumePath;
  const resumeOpenUrl = resumeUrl ? resolveResumeUrl(resumeUrl) : null;

  const handleViewResume = () => {
    if (!resumeOpenUrl) return;
    const a = document.createElement('a');
    a.href = resumeOpenUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Application Details" className="max-w-3xl">
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="flex items-start justify-between bg-gray-50 p-4 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{studentInfo.name}</h2>
              <p className="text-gray-500 flex items-center gap-1.5 text-sm mt-1">
                <Mail size={14} /> {studentInfo.email}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5
            ${application.status === 'Accepted' ? 'bg-green-100 text-green-700' : 
              application.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
              'bg-yellow-100 text-yellow-700'}`}>
            {application.status === 'Accepted' && <CheckCircle size={14} />}
            {application.status === 'Rejected' && <XCircle size={14} />}
            {application.status}
          </div>
        </div>

        {/* Two-Column Layout for Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Academic & Personal */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Student Profile</h3>
            
            <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
              <Phone className="text-gray-400" size={18} />
              <div>
                <p className="text-xs text-gray-500 font-medium">Phone</p>
                <p className="text-sm font-semibold text-gray-800">{studentInfo.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
              <Building className="text-gray-400" size={18} />
              <div>
                <p className="text-xs text-gray-500 font-medium">University / College</p>
                <p className="text-sm font-semibold text-gray-800">{studentInfo.college}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
              <GraduationCap className="text-gray-400" size={18} />
              <div>
                <p className="text-xs text-gray-500 font-medium">Course & Year</p>
                <p className="text-sm font-semibold text-gray-800">{studentInfo.course} • {studentInfo.year}</p>
              </div>
            </div>
          </div>

          {/* Column 2: Application Info */}
          <div className="space-y-4">
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Application Context</h3>

             <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
              <BookOpen className="text-gray-400" size={18} />
              <div>
                <p className="text-xs text-gray-500 font-medium">Applying For</p>
                <p className="text-sm font-semibold text-gray-800">{internshipInfo.title}</p>
              </div>
            </div>

             <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
              <Calendar className="text-gray-400" size={18} />
              <div>
                <p className="text-xs text-gray-500 font-medium">Applied On</p>
                <p className="text-sm font-semibold text-gray-800">
                  {new Date(application.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </p>
              </div>
            </div>

             {/* Skills if available */}
             {application.details?.skills && application.details.skills.length > 0 && (
                <div className="p-3 bg-white border border-gray-100 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {application.details.skills.map((skill, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
             )}
          </div>
        </div>

        {/* Answers / Notes Section */}
        {(application.answers || application.details?.notes) && (
           <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
             <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
               <FileText size={16} /> Additional Information
             </h3>
             <div className="space-y-4">
                {application.details?.notes && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Applicant Notes</p>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                      {application.details.notes}
                    </p>
                  </div>
                )}
                
                {application.answers && Object.entries(application.answers).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                      {value}
                    </p>
                  </div>
                ))}
             </div>
           </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
           <button
             onClick={handleViewResume}
             disabled={!resumeUrl}
             className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all
               ${resumeUrl 
                 ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-md' 
                 : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
           >
             <FileText size={18} />
             {resumeUrl ? 'View Resume' : 'No Resume Attached'}
           </button>

           <div className="flex items-center gap-3">
             <button
               onClick={onClose}
               className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
             >
               Close
             </button>

             {internshipInfo.applyLink && (
               <a
                 href={internshipInfo.applyLink}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
               >
                 Apply on Official Site <ExternalLink size={18} />
               </a>
             )}
           </div>
        </div>

      </div>
    </Modal>
  );
};

export default ApplicationDetailsModal;
