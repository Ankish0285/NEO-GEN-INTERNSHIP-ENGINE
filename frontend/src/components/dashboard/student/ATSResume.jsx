import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Loader2, XCircle, Award, Target, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { api } from '../../../services/api';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import { Skeleton } from '../../ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

import { useStudentDashboard } from '../../../context/StudentDashboardContext';

const ATSResume = () => {
  const { atsScoreData, onResumeUploadSuccess: onUploadSuccess, loadingAtsScore: loading } = useStudentDashboard();
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [jobDescription, setJobDescription] = useState('');

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="lg:col-span-2 h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  const score = atsScoreData?.score || 0;
  console.log('Current atsScoreData:', atsScoreData);
  console.log('Displayed score:', score);
  
  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // emerald-500
    if (score >= 60) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  const scoreColor = getScoreColor(score);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!['.pdf', '.doc', '.docx'].includes(ext)) {
      toast.error('Only PDF, DOC, and DOCX files are allowed');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Uploading and analyzing resume...');

    try {
        const formData = new FormData();
        formData.append('resume', file);
        if (jobDescription.trim()) {
            formData.append('jobDescription', jobDescription);
        }
        
        console.log('Uploading resume with jobDescription:', jobDescription || 'none');
        const response = await api.post('/resume/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        console.log('Upload response:', response.data);
        if (onUploadSuccess) {
            onUploadSuccess(response.data);
        }
        toast.success('Resume analyzed successfully!', { id: toastId });
    } catch (err) {
        console.error("Upload error", err);
        toast.error('Failed to upload resume. Please try again.', { id: toastId });
    } finally {
        setIsUploading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-navy flex items-center gap-2">
              <FileText className="w-8 h-8 text-saffron" />
              ATS Resume Checker
            </h1>
            <p className="text-sub mt-2 text-lg">Optimize your resume to pass Applicant Tracking Systems.</p>
        </div>
        {atsScoreData && !atsScoreData.isDemoData && (
             <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-secondary flex items-center"
             >
                <Download size={16} className="mr-2" />
                Download Report
             </motion.button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Card */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
            <div 
                className={clsx(
                    "glass-card p-10 flex flex-col items-center justify-center h-full min-h-[350px] relative group border-2 border-dashed",
                    dragActive ? "border-saffron bg-saffron/5" : "border-saffron/30 hover:border-saffron hover:bg-gradient-to-br hover:from-saffron/5 hover:to-green-primary/5",
                    isUploading ? "opacity-75 pointer-events-none" : ""
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                {isUploading ? (
                    <div className="flex flex-col items-center z-10">
                        <div className="relative">
                            <div className="absolute inset-0 bg-saffron-light rounded-full animate-ping opacity-75"></div>
                            <div className="relative bg-gradient-to-br from-saffron/10 to-white/60 backdrop-blur-md p-4 rounded-full shadow-sm border border-saffron/20">
                                <Loader2 size={48} className="text-saffron animate-spin" />
                            </div>
                        </div>
                        <p className="text-xl font-bold text-navy mt-6">Analyzing your resume...</p>
                        <p className="text-sub mt-2 font-medium">This usually takes a few seconds.</p>
                    </div>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-saffron-light text-saffron rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-white/50 group-hover:scale-110 transition-transform duration-300">
                            <Upload size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-navy mb-2">2. Upload your resume</h3>
                        <p className="text-sub mb-8 max-w-sm text-center leading-relaxed font-medium">
                            Drag and drop your resume here, or click to browse. <br/>
                            <span className="mt-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">Supported formats: PDF, DOC, DOCX (Max 10MB)</span>
                        </p>
                        
                        <label className="relative cursor-pointer">
                            <motion.span 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn-primary inline-block"
                            >
                                Select Resume File
                            </motion.span>
                            <input type="file" className="hidden" onChange={handleChange} accept=".pdf,.doc,.docx" />
                        </label>
                    </>
                )}
            </div>
        </motion.div>

        {/* Score Card */}
        <motion.div variants={itemVariants} className="glass-card p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Target size={160} />
            </div>
            
            <h3 className="text-xl font-bold text-navy mb-6 flex items-center gap-2 relative z-10">
                <Award className="text-saffron" size={24} />
                ATS Score
            </h3>
            
            <div className="flex-1 flex flex-col items-center justify-center mb-6">
                <div className="relative w-56 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={[{ value: score }, { value: 100 - score }]}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                startAngle={90}
                                endAngle={-270}
                                dataKey="value"
                                stroke="none"
                            >
                                <Cell fill={scoreColor} />
                                <Cell fill="#f3f4f6" />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
                            className="text-5xl font-black text-gray-900 tracking-tighter"
                        >
                            {score}
                        </motion.span>
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">Out of 100</span>
                    </div>
                </div>
                
                <div className="mt-2 text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className={clsx("inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border", {
                            "bg-green-50 text-green-700 border-green-200": score >= 80,
                            "bg-yellow-50 text-yellow-700 border-yellow-200": score >= 60 && score < 80,
                            "bg-red-50 text-red-700 border-red-200": score < 60
                        })}
                    >
                        {score >= 80 ? "Excellent Profile" : score >= 60 ? "Good Start" : "Needs Improvement"}
                    </motion.div>
                </div>
            </div>

            <div className="space-y-5 relative z-10">
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-navy/70 font-semibold">Technical Skills</span>
                        <span className="font-bold text-navy">{atsScoreData?.breakdown?.technical || 0}%</span>
                    </div>
                    <div className="w-full bg-navy/5 rounded-full h-2.5 overflow-hidden shadow-inner">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${atsScoreData?.breakdown?.technical || 0}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="bg-green-primary h-2.5 rounded-full" 
                        />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-navy/70 font-semibold">Formatting</span>
                        <span className="font-bold text-navy">{atsScoreData?.breakdown?.formatting || 0}%</span>
                    </div>
                    <div className="w-full bg-navy/5 rounded-full h-2.5 overflow-hidden shadow-inner">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${atsScoreData?.breakdown?.formatting || 0}%` }}
                            transition={{ duration: 1, delay: 0.7 }}
                            className="bg-saffron h-2.5 rounded-full" 
                        />
                    </div>
                </div>
            </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Missing Skills */}
        <motion.div variants={itemVariants} className="glass-card p-6">
            <h3 className="text-lg font-bold text-navy mb-4 flex items-center gap-2">
                <AlertCircle className="text-saffron-hover" size={22} />
                Missing Skills
            </h3>
            <p className="text-sub font-medium text-sm mb-6">
                These keywords are commonly required for your target role but were not found in your resume.
            </p>
            
            {atsScoreData?.missingKeywords?.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                    {atsScoreData.missingKeywords.map((skill, index) => (
                        <motion.span 
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="px-3.5 py-1.5 bg-saffron-light/50 text-saffron-hover rounded-lg text-sm font-bold shadow-sm border border-saffron-light flex items-center gap-1.5 hover:bg-saffron-light transition-colors cursor-default"
                        >
                            <XCircle size={16} />
                            {skill}
                        </motion.span>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-gradient-to-br from-green-primary/5 to-transparent rounded-xl border border-green-primary/20 border-dashed">
                    <CheckCircle className="text-green-primary mb-3" size={36} />
                    <p className="text-navy font-bold text-lg">No missing skills detected!</p>
                    <p className="text-sub font-medium text-sm mt-1">Your resume covers all the key requirements.</p>
                </div>
            )}
        </motion.div>

        {/* Matched Skills */}
        <motion.div variants={itemVariants} className="glass-card p-6">
            <h3 className="text-lg font-bold text-navy mb-4 flex items-center gap-2">
                <CheckCircle className="text-green-primary" size={22} />
                Matched Skills
            </h3>
            <p className="text-sub font-medium text-sm mb-6">
                Great job! These required skills were successfully detected in your resume.
            </p>
            
            {atsScoreData?.matchedKeywords?.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                    {atsScoreData.matchedKeywords.map((skill, index) => (
                        <motion.span 
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="px-3.5 py-1.5 bg-green-light/80 text-green-hover rounded-lg text-sm font-bold shadow-sm border border-green-light flex items-center gap-1.5 hover:bg-green-light transition-colors cursor-default"
                        >
                            <CheckCircle size={16} />
                            {skill}
                        </motion.span>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-gradient-to-br from-saffron/5 to-transparent rounded-xl border border-saffron/20 border-dashed">
                    <AlertCircle className="text-saffron-hover/60 mb-3" size={36} />
                    <p className="text-navy font-bold text-lg">No matched skills found</p>
                    <p className="text-sub font-medium text-sm mt-1">Try adding more relevant keywords to your resume.</p>
                </div>
            )}
        </motion.div>
      </div>

      {/* Suggestions Section */}
      {atsScoreData?.suggestions?.length > 0 && (
          <motion.div variants={itemVariants} className="glass-card p-6 border-t-4 border-t-saffron">
              <h3 className="text-xl font-bold text-navy mb-5 flex items-center gap-2">
                  <Zap className="text-saffron" size={24} />
                  Improvement Suggestions
              </h3>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {atsScoreData.suggestions.map((suggestion, index) => (
                      <motion.div 
                        key={index} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start p-5 bg-gradient-to-br from-saffron/5 to-white/40 rounded-xl shadow-sm border border-saffron/10 hover:shadow-md transition-all hover:-translate-y-0.5"
                      >
                          <div className="bg-gradient-to-br from-saffron/20 to-saffron/5 p-2.5 rounded-xl mr-4 flex-shrink-0 shadow-sm border border-saffron/10">
                            <AlertCircle size={20} className="text-saffron-hover" />
                          </div>
                          <p className="text-sm font-medium text-navy/80 leading-relaxed pt-1">{suggestion}</p>
                      </motion.div>
                  ))}
              </div>
          </motion.div>
      )}
    </motion.div>
  );
};

export default ATSResume;
