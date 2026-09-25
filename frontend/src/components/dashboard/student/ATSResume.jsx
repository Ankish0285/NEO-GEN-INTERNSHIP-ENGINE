import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload, FileText, CheckCircle, AlertCircle, Download,
  Loader2, XCircle, Award, Target, Zap, Lock, Crown,
  RefreshCw, Star, Shield, Tag,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import resumeService from '../../../services/resumeService';
import { api } from '../../../services/api';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import { Skeleton } from '../../ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudentDashboard } from '../../../context/StudentDashboardContext';

// ─── Usage bar component ───────────────────────────────────────────────────────
const UsageBar = ({ freeUsed, freeLimit, isSubscribed, subscription, onViewPlans }) => {
  const remaining = Math.max(0, freeLimit - freeUsed);
  const pct       = freeLimit > 0 ? Math.min(100, (freeUsed / freeLimit) * 100) : 100;
  const exhausted = freeUsed >= freeLimit;

  if (isSubscribed && subscription) {
    const expiry = subscription.expiresAt
      ? new Date(subscription.expiresAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
      : null;
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
        <Crown size={20} className="text-emerald-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-emerald-800">{subscription.planName || 'Pro'} — Active</p>
          {expiry && <p className="text-xs text-emerald-600">Valid until {expiry}</p>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(subscription.features || {})
            .filter(([, v]) => v === true)
            .map(([k]) => {
              const lbl = { atsAnalysis:'ATS', aiResumeAnalysis:'AI Analysis', aiReport:'AI Report', premiumRecommendations:'Recs' }[k];
              return lbl ? (
                <span key={k} className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle size={10} /> {lbl}
                </span>
              ) : null;
            })}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(
      'px-4 py-3 rounded-xl border',
      exhausted ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
    )}>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <Shield size={15} className={exhausted ? 'text-red-500' : 'text-[#FF9933]'} />
          Free Resume Checks
        </span>
        <span className={clsx('text-xs font-bold', exhausted ? 'text-red-600' : 'text-gray-600')}>
          {freeUsed} / {freeLimit} used
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className={clsx('h-full rounded-full', exhausted ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-[#FF9933]')}
        />
      </div>
      {exhausted ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-red-600 font-medium">All free checks used. Subscribe to continue.</p>
          <button onClick={onViewPlans}
            className="text-xs px-3 py-1 bg-[#FF9933] text-white rounded-full font-semibold hover:bg-[#e68a2e] ml-2 shrink-0">
            View Plans
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-500 font-medium">
          {remaining} free {remaining === 1 ? 'check' : 'checks'} remaining
        </p>
      )}
    </div>
  );
};

// ─── Paywall modal — 3-step: Select Plan → Promo → Pay ────────────────────────
const PaywallModal = ({ freeLimit, plans, onClose, onSubscribed }) => {
  const [step,       setStep]       = useState(1);  // 1=plan, 2=promo+summary, 3=result
  const [selPlan,    setSelPlan]    = useState(null);
  const [promoCode,  setPromoCode]  = useState('');
  const [promoResult, setPromoResult] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [result,     setResult]     = useState(null); // { success, message, planName, expiresAt }

  const finalAmount    = promoResult?.valid ? promoResult.discountedAmount : selPlan?.price;
  const discountAmount = promoResult?.valid ? promoResult.discountAmount   : 0;

  const validatePromo = async () => {
    if (!promoCode.trim() || !selPlan) return;
    setPromoLoading(true);
    try {
      const r = await api.post('/subscriptions/promo/validate', {
        code:   promoCode.trim(),
        planId: selPlan._id,
      });
      setPromoResult(r);
    } catch {
      setPromoResult({ valid: false, message: 'Could not validate. Try again.' });
    } finally { setPromoLoading(false); }
  };

  const handlePay = async () => {
    if (!selPlan) return;
    setPayLoading(true);
    try {
      // Step 1: Create Razorpay order on backend
      const orderRes = await api.post('/subscriptions/create-order', {
        planId:    selPlan._id,
        promoCode: promoCode.trim() || undefined,
      });

      const keyId = orderRes.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!keyId || keyId.includes('REPLACE')) {
        toast.error('Payment gateway not configured. Contact admin to activate subscription manually.');
        setPayLoading(false);
        return;
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key:         keyId,
        amount:      orderRes.amountInPaise,
        currency:    orderRes.currency || 'INR',
        name:        'NEO GEN Internship Engine',
        description: `${orderRes.planName} Subscription`,
        order_id:    orderRes.orderId,
        theme:       { color: '#FF9933' },   // saffron — matches site primary
        modal: {
          ondismiss: () => {
            setPayLoading(false);
            toast('Payment cancelled. You can try again anytime.', { icon: 'ℹ️' });
          },
        },
        handler: async (response) => {
          // Step 3: Verify signature on backend
          try {
            const verifyRes = await api.post('/subscriptions/verify-payment', {
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              subscriptionId:    orderRes.subscriptionId,
            });
            setResult({
              success:  true,
              message:  verifyRes.message,
              planName: verifyRes.subscription?.planName,
              expiresAt: verifyRes.subscription?.expiresAt,
            });
            setStep(3);
            if (onSubscribed) onSubscribed();
          } catch (err) {
            setResult({
              success: false,
              message: err?.data?.message || 'Payment verification failed.',
            });
            setStep(3);
          } finally {
            setPayLoading(false);
          }
        },
      };

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src   = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload  = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      new window.Razorpay(options).open();

    } catch (err) {
      setPayLoading(false);
      toast.error(err?.data?.message || 'Could not initiate payment. Try again.');
    }
  };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
    : null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh' }}
      >
        {/* ── Header — uses site theme, NOT arbitrary purple ── */}
        <div
          className="px-6 py-5 text-white"
          style={{ background: 'linear-gradient(135deg, #FF9933 0%, #e68a2e 100%)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock size={22} className="opacity-90" />
              <div>
                <h2 className="text-lg font-black leading-tight">Premium Required</h2>
                <p className="text-xs opacity-90 mt-0.5">
                  {step === 1 ? 'Select a plan to continue' :
                   step === 2 ? 'Review your order'        : 'Payment status'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
              <XCircle size={20} />
            </button>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mt-4">
            {['Select Plan', 'Review', 'Done'].map((label, i) => (
              <React.Fragment key={i}>
                <div className={`flex items-center gap-1 ${step > i+1 || step === i+1 ? 'opacity-100' : 'opacity-50'}`}>
                  <div className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center
                    ${step > i+1 ? 'bg-white text-[#FF9933]' : step === i+1 ? 'bg-white/30 text-white border border-white' : 'bg-white/20 text-white'}`}>
                    {step > i+1 ? '✓' : i+1}
                  </div>
                  <span className="text-xs font-medium text-white/90">{label}</span>
                </div>
                {i < 2 && <div className="flex-1 h-px bg-white/30 mx-1" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* STEP 1 — Select plan */}
          {step === 1 && (
            <>
              <p className="text-sm font-medium text-gray-500 text-center">
                You have used all <strong>{freeLimit}</strong> free resume analyses.
              </p>
              {plans.length === 0 ? (
                <div className="text-center py-8 text-gray-400">Loading plans…</div>
              ) : plans.map(plan => {
                const selected = selPlan?._id === plan._id;
                return (
                  <button key={plan._id} type="button"
                    onClick={() => setSelPlan(plan)}
                    className={`w-full text-left rounded-xl p-4 border-2 transition-all ${
                      selected
                        ? 'border-[#FF9933] bg-[#fff8f0] shadow-md'
                        : 'border-gray-200 hover:border-[#FF9933]/50 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900">{plan.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{plan.durationDays} days</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-[#FF9933]">₹{plan.price}</p>
                        {selected && (
                          <span className="text-xs bg-[#FF9933] text-white px-2 py-0.5 rounded-full font-semibold mt-1 inline-block">
                            Selected ✓
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {Object.entries(plan.features || {}).filter(([, v]) => v === true).map(([k]) => {
                        const lbl = { atsAnalysis:'ATS Score', aiResumeAnalysis:'AI Analysis', aiReport:'AI Report', premiumRecommendations:'Premium Recs' }[k];
                        return lbl ? (
                          <span key={k} className="text-xs bg-[#fff0e0] text-[#e68a2e] px-2 py-0.5 rounded-full border border-[#FFD4A0] flex items-center gap-1">
                            <CheckCircle size={10} /> {lbl}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* STEP 2 — Promo + Order summary */}
          {step === 2 && selPlan && (
            <>
              {/* Promo code */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Tag size={14} className="text-[#FF9933]" /> Promo Code
                  <span className="text-xs font-normal text-gray-400">(optional)</span>
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
                    placeholder="e.g. SAVE20"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono font-semibold tracking-widest focus:outline-none focus:border-[#FF9933] uppercase"
                  />
                  <button type="button"
                    onClick={validatePromo}
                    disabled={!promoCode.trim() || promoLoading}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
                    style={{ background: '#fff0e0', color: '#e68a2e', border: '1px solid #FFD4A0' }}
                  >
                    {promoLoading ? '…' : 'Apply'}
                  </button>
                </div>
                {promoResult && (
                  <p className={`mt-1.5 text-xs font-semibold ${promoResult.valid ? 'text-[#138808]' : 'text-red-500'}`}>
                    {promoResult.valid
                      ? `✓ ${promoResult.discountLabel} applied!`
                      : `✗ ${promoResult.message}`}
                  </p>
                )}
              </div>

              {/* Order summary */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order Summary</p>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Plan</span>
                    <span className="font-semibold text-gray-900">{selPlan.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Original Price</span>
                    <span className="font-semibold text-gray-900">₹{selPlan.price}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#138808]">Promo Discount</span>
                      <span className="font-bold text-[#138808]">-₹{discountAmount}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="font-bold text-gray-900">Total Payable</span>
                    <span className="text-xl font-black text-[#FF9933]">₹{finalAmount}</span>
                  </div>
                  <p className="text-xs text-gray-400">Duration: {selPlan.durationDays} days</p>
                </div>
              </div>
            </>
          )}

          {/* STEP 3 — Result */}
          {step === 3 && result && (
            <div className="text-center py-6">
              {result.success ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-[#e3f2e1] flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={36} className="text-[#138808]" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-1">🎉 Payment Successful!</h3>
                  <p className="text-sm text-gray-600 mb-3">Premium subscription activated.</p>
                  <div className="bg-[#f0fdf4] border border-[#138808]/20 rounded-xl p-4 text-left space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Plan</span>
                      <span className="font-bold text-gray-900">{result.planName}</span>
                    </div>
                    {result.expiresAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Valid Until</span>
                        <span className="font-bold text-gray-900">{fmtDate(result.expiresAt)}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <XCircle size={36} className="text-red-500" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-1">Payment Failed</h3>
                  <p className="text-sm text-gray-500">{result.message}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex gap-3">
          {step === 1 && (
            <>
              <button onClick={onClose}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Maybe Later
              </button>
              <button
                disabled={!selPlan}
                onClick={() => setStep(2)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: selPlan ? 'linear-gradient(135deg,#FF9933,#e68a2e)' : '#d1d5db' }}
              >
                Continue →
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button onClick={() => { setStep(1); setPromoResult(null); setPromoCode(''); }}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
                ← Back
              </button>
              <button
                disabled={payLoading}
                onClick={handlePay}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#FF9933,#e68a2e)' }}
              >
                {payLoading
                  ? <><Loader2 size={16} className="animate-spin" /> Preparing…</>
                  : <>Pay ₹{finalAmount}</>}
              </button>
            </>
          )}
          {step === 3 && (
            <button
              onClick={() => { onClose(); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: result?.success ? '#138808' : '#6b7280' }}
            >
              {result?.success ? 'Start Using Premium' : 'Close'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────
const ATSResume = () => {
  const { atsScoreData, onResumeUploadSuccess: onUploadSuccess, loadingAtsScore: loading } = useStudentDashboard();
  const [dragActive,  setDragActive]  = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [jobDescription, setJobDescription] = useState('');

  // Subscription / usage state
  const [usageData,    setUsageData]    = useState(null);   // { freeUsed, freeLimit, isSubscribed, subscription }
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [showPaywall,  setShowPaywall]  = useState(false);
  const [plans,        setPlans]        = useState([]);

  // Derived booleans (backend is source of truth; this is just UI sugar)
  const isSubscribed = usageData?.isSubscribed ?? false;
  const freeUsed     = usageData?.freeUsed     ?? 0;
  const freeLimit    = usageData?.freeLimit     ?? 2;
  const isBlocked    = !isSubscribed && freeUsed >= freeLimit;

  const fetchUsage = useCallback(async () => {
    setLoadingUsage(true);
    try {
      const r = await api.get('/subscriptions/me');
      setUsageData({
        freeUsed:     r.usage?.freeUsed     ?? 0,
        freeLimit:    r.usage?.freeLimit     ?? 2,
        isSubscribed: r.isSubscribed,
        subscription: r.subscription,
      });
    } catch {
      // Non-fatal — page still works; backend will reject if limit exceeded
      setUsageData(null);
    } finally {
      setLoadingUsage(false);
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try { const r = await api.get('/subscriptions/plans'); setPlans(r.plans || []); }
    catch { /* non-fatal */ }
  }, []);

  useEffect(() => { fetchUsage(); fetchPlans(); }, [fetchUsage, fetchPlans]);

  const openPaywall = () => setShowPaywall(true);

  const handleSubscribe = (plan) => {
    // Now handled entirely inside PaywallModal with Razorpay
    toast('Contact the admin to activate your subscription.', { icon: '💳' });
    setShowPaywall(false);
  };

  // ── Drag handlers ──
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };
  const handleChange = (e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); };

  const handleFile = async (file) => {
    // Frontend guard — backend enforces the real limit
    if (isBlocked) { openPaywall(); return; }

    if (file.size > 10 * 1024 * 1024) { toast.error('File size must be less than 10MB'); return; }
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!['.pdf', '.doc', '.docx'].includes(ext)) { toast.error('Only PDF, DOC, and DOCX files are allowed'); return; }

    setIsUploading(true);
    const toastId = toast.loading('Uploading and analyzing resume…');

    try {
      const response = await resumeService.uploadResume(file, jobDescription.trim());
      if (onUploadSuccess) onUploadSuccess(response);

      // Update local usage from the response if the backend returned it
      if (response?.usage) {
        setUsageData(prev => ({
          ...(prev || {}),
          freeUsed:     response.usage.freeUsed,
          freeLimit:    response.usage.freeLimit,
          isSubscribed: response.usage.isSubscribed,
        }));
      } else {
        // Re-fetch to get the fresh count
        fetchUsage();
      }

      toast.success('Resume analyzed successfully!', { id: toastId });
    } catch (err) {
      // Handle the 403 SUBSCRIPTION_REQUIRED from the backend
      if (err?.status === 403 || err?.response?.status === 403) {
        toast.dismiss(toastId);
        fetchUsage(); // refresh so the bar shows updated count
        openPaywall();
        return;
      }
      console.error('Upload error', err);
      toast.error(err?.data?.message || 'Failed to upload resume. Please try again.', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const score      = atsScoreData?.score || 0;
  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  const containerVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
  };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div><Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-4 w-96" /></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Paywall modal */}
      <AnimatePresence>
        {showPaywall && (
          <PaywallModal
            freeLimit={freeLimit}
            plans={plans}
            onClose={() => setShowPaywall(false)}
            onSubscribed={() => { setShowPaywall(false); fetchUsage(); }}
          />
        )}
      </AnimatePresence>

      <motion.div
        key={`ats-view-${score}-${atsScoreData?.matchedKeywords?.length ?? 0}`}
        className="space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
              <FileText className="w-8 h-8 text-[#FF9933]" />
              ATS Resume Checker
            </h1>
            <p className="text-sub mt-2 text-lg">
              {atsScoreData?.score > 0
                ? 'Your latest ATS analysis — upload again to refresh scores.'
                : 'Upload your resume to get a real ATS score and keyword analysis.'}
            </p>
          </div>
          {atsScoreData?.score > 0 && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="btn-secondary flex items-center">
              <Download size={16} className="mr-2" /> Download Report
            </motion.button>
          )}
        </div>

        {/* Usage bar */}
        {!loadingUsage && (
          <UsageBar
            freeUsed={freeUsed}
            freeLimit={freeLimit}
            isSubscribed={isSubscribed}
            subscription={usageData?.subscription}
            onViewPlans={openPaywall}
          />
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Upload card */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            {isBlocked ? (
              /* ── Paywall state — blocked upload area ── */
              <div className="glass-card p-10 flex flex-col items-center justify-center h-full min-h-87.5 border-2 border-dashed border-gray-200 bg-gray-50/50 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                  <Lock size={40} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">🔒 Premium Required</h3>
                <p className="text-gray-500 max-w-sm mb-6 leading-relaxed">
                  You have used all <strong>{freeLimit}</strong> free resume analyses.
                  Subscribe to continue using ATS Score and AI Resume Features.
                </p>
                <div className="flex gap-3">
                  <button onClick={openPaywall}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 flex items-center gap-2">
                    <Crown size={16} /> View Plans
                  </button>
                  <button onClick={fetchUsage}
                    className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-100 flex items-center gap-2">
                    <RefreshCw size={15} /> Refresh
                  </button>
                </div>
              </div>
            ) : (
              /* ── Normal upload area ── */
              <div
                className={clsx(
                  'glass-card p-10 flex flex-col items-center justify-center h-full min-h-87.5 relative group border-2 border-dashed',
                  dragActive ? 'border-[#FF9933] bg-[#fff4e8]' : 'border-[rgba(255,153,51,0.3)] hover:border-[#FF9933] hover:bg-linear-to-br hover:from-[#fff4e8] hover:to-[#e8f5e6]',
                  isUploading ? 'opacity-75 pointer-events-none' : ''
                )}
                onDragEnter={handleDrag} onDragLeave={handleDrag}
                onDragOver={handleDrag}  onDrop={handleDrop}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center z-10">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#fff0e0] rounded-full animate-ping opacity-75" />
                      <div className="relative bg-linear-to-br from-[#fff4e8] to-white/60 backdrop-blur-md p-4 rounded-full shadow-sm border border-[rgba(255,153,51,0.2)]">
                        <Loader2 size={48} className="text-[#FF9933] animate-spin" />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-[#111827] mt-6">Analyzing your resume…</p>
                    <p className="text-sub mt-2 font-medium">This usually takes a few seconds.</p>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-[#fff0e0] text-[#FF9933] rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-white/50 group-hover:scale-110 transition-transform duration-300">
                      <Upload size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-[#111827] mb-2">Upload your resume</h3>
                    <p className="text-sub mb-8 max-w-sm text-center leading-relaxed font-medium">
                      Drag and drop your resume here, or click to browse.<br />
                      <span className="mt-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                        PDF, DOC, DOCX · Max 10 MB
                      </span>
                    </p>
                    {/* Job description (optional) */}
                    <div className="w-full max-w-sm mb-4">
                      <input
                        type="text"
                        value={jobDescription}
                        onChange={e => setJobDescription(e.target.value)}
                        placeholder="Optional: paste job description for better matching"
                        className="w-full text-sm border border-[rgba(255,153,51,0.2)] rounded-xl px-4 py-2 bg-white/60 focus:outline-none focus:border-[#FF9933]"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                    <label className="relative cursor-pointer">
                      <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="btn-primary inline-block">
                        Select Resume File
                      </motion.span>
                      <input type="file" className="hidden" onChange={handleChange} accept=".pdf,.doc,.docx" />
                    </label>
                    {/* Remaining checks hint */}
                    {!isSubscribed && (
                      <p className="mt-4 text-xs text-gray-400">
                        {freeLimit - freeUsed} free {freeLimit - freeUsed === 1 ? 'check' : 'checks'} remaining
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </motion.div>

          {/* Score card — always show (shows 0 if no upload yet) */}
          <motion.div variants={itemVariants} className="glass-card p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Target size={160} /></div>
            <h3 className="text-xl font-bold text-[#111827] mb-6 flex items-center gap-2 relative z-10">
              <Award className="text-[#FF9933]" size={24} /> ATS Score
            </h3>
            <div className="flex-1 flex flex-col items-center justify-center mb-6">
              <div className="relative w-56 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ value: score }, { value: 100 - score }]}
                      cx="50%" cy="50%" innerRadius={70} outerRadius={90}
                      startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                      <Cell fill={scoreColor} />
                      <Cell fill="#f3f4f6" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span key={`score-${score}`} initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                    className="text-5xl font-black text-gray-900 tracking-tighter">
                    {score}
                  </motion.span>
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">Out of 100</span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                  className={clsx('inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border', {
                    'bg-green-50 text-green-700 border-green-200':   score >= 80,
                    'bg-yellow-50 text-yellow-700 border-yellow-200': score >= 60 && score < 80,
                    'bg-red-50 text-red-700 border-red-200':          score < 60,
                  })}>
                  {score >= 80 ? 'Excellent Profile' : score >= 60 ? 'Good Start' : score > 0 ? 'Needs Improvement' : 'No resume yet'}
                </motion.div>
              </div>
            </div>

            <div className="space-y-5 relative z-10">
              {[['Technical Skills', 'technical', 'bg-[#138808]'], ['Formatting', 'formatting', 'bg-[#FF9933]']].map(([label, key, color]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#111827]/70 font-semibold">{label}</span>
                    <span className="font-bold text-[#111827]">{atsScoreData?.breakdown?.[key] || 0}%</span>
                  </div>
                  <div className="w-full bg-navy/5 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <motion.div key={`bar-${key}-${atsScoreData?.breakdown?.[key]}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${atsScoreData?.breakdown?.[key] || 0}%` }}
                      transition={{ duration: 0.6 }}
                      className={`${color} h-2.5 rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Missing / Matched skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div variants={itemVariants} className="glass-card p-6">
            <h3 className="text-lg font-bold text-[#111827] mb-4 flex items-center gap-2">
              <AlertCircle className="text-[#e68a2e]" size={22} /> Missing Skills
            </h3>
            <p className="text-sub font-medium text-sm mb-6">Keywords commonly required but not found in your resume.</p>
            {atsScoreData?.missingKeywords?.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {atsScoreData.missingKeywords.map((skill, i) => (
                  <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    className="px-3.5 py-1.5 bg-[#fff0e0] text-[#e68a2e] rounded-lg text-sm font-bold shadow-sm border border-[rgba(255,153,51,0.25)] flex items-center gap-1.5">
                    <XCircle size={16} /> {skill}
                  </motion.span>
                ))}
              </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-linear-to-br from-[#e8f5e6] to-transparent rounded-xl border border-[rgba(19,136,8,0.2)] border-dashed">
                <CheckCircle className="text-[#138808] mb-3" size={36} />
                <p className="text-[#111827] font-bold text-lg">No missing skills detected!</p>
                <p className="text-sub font-medium text-sm mt-1">Your resume covers all the key requirements.</p>
              </div>
            )}
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card p-6">
            <h3 className="text-lg font-bold text-[#111827] mb-4 flex items-center gap-2">
              <CheckCircle className="text-[#138808]" size={22} /> Matched Skills
            </h3>
            <p className="text-sub font-medium text-sm mb-6">Required skills successfully detected in your resume.</p>
            {atsScoreData?.matchedKeywords?.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {atsScoreData.matchedKeywords.map((skill, i) => (
                  <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    className="px-3.5 py-1.5 bg-[#e3f2e1] text-[#0f7006] rounded-lg text-sm font-bold shadow-sm border border-[rgba(19,136,8,0.2)] flex items-center gap-1.5">
                    <CheckCircle size={16} /> {skill}
                  </motion.span>
                ))}
              </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-linear-to-br from-[#fff4e8] to-transparent rounded-xl border border-[rgba(255,153,51,0.2)] border-dashed">
                <AlertCircle className="text-[#e68a2e]/60 mb-3" size={36} />
                <p className="text-[#111827] font-bold text-lg">No matched skills found</p>
                <p className="text-sub font-medium text-sm mt-1">Add more relevant keywords to your resume.</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Suggestions */}
        {atsScoreData?.suggestions?.length > 0 && (
          <motion.div variants={itemVariants} className="glass-card p-6 border-t-4 border-t-[#FF9933]">
            <h3 className="text-xl font-bold text-[#111827] mb-5 flex items-center gap-2">
              <Zap className="text-[#FF9933]" size={24} /> Improvement Suggestions
            </h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {atsScoreData.suggestions.map((suggestion, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="flex items-start p-5 bg-linear-to-br from-[#fff4e8] to-white/40 rounded-xl shadow-sm border border-[rgba(255,153,51,0.18)] hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="bg-linear-to-br from-[#fff0e0] to-[#fffaf5] p-2.5 rounded-xl mr-4 shrink-0 shadow-sm border border-[rgba(255,153,51,0.2)]">
                    <AlertCircle size={20} className="text-[#e68a2e]" />
                  </div>
                  <p className="text-sm font-medium text-[#111827]/80 leading-relaxed pt-1">{suggestion}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

export default ATSResume;
