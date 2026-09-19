/**
 * UpgradeModal — shared subscription paywall modal.
 *
 * Usage:
 *   import UpgradeModal from '../../ui/UpgradeModal';
 *   <UpgradeModal isOpen={showUpgrade} onClose={closeUpgrade} onSubscribed={refresh} />
 *
 * The modal reads plans from SubscriptionContext so they are fetched once across the app.
 * It manages the 3-step flow (Select Plan → Promo + Summary → Result) internally.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, XCircle, CheckCircle, Loader2, Tag, Crown,
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useSubscription } from '../../context/SubscriptionContext';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

const HEADER_GRADIENT = 'linear-gradient(135deg,#FF9933 0%,#e68a2e 100%)';
const BTN_GRADIENT    = 'linear-gradient(135deg,#FF9933,#e68a2e)';

// ─── Step indicator ───────────────────────────────────────────────────────────
const Steps = ({ current }) => (
  <div className="flex items-center gap-1.5 mt-4">
    {['Select Plan', 'Review', 'Done'].map((label, i) => (
      <React.Fragment key={i}>
        <div className={`flex items-center gap-1 ${current > i + 1 || current === i + 1 ? 'opacity-100' : 'opacity-50'}`}>
          <div className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center
            ${current > i + 1 ? 'bg-white text-[#FF9933]'
              : current === i + 1 ? 'bg-white/30 text-white border border-white'
              : 'bg-white/20 text-white'}`}>
            {current > i + 1 ? '✓' : i + 1}
          </div>
          <span className="text-xs font-medium text-white/90 hidden sm:inline">{label}</span>
        </div>
        {i < 2 && <div className="flex-1 h-px bg-white/30 mx-1" />}
      </React.Fragment>
    ))}
  </div>
);

// ─── Main export ──────────────────────────────────────────────────────────────
const UpgradeModal = ({ isOpen, onClose, onSubscribed, featureLabel = 'this AI feature' }) => {
  const { plans, freeLimit, refresh } = useSubscription();

  const [step,         setStep]        = useState(1);
  const [selPlan,      setSelPlan]     = useState(null);
  const [promoCode,    setPromoCode]   = useState('');
  const [promoResult,  setPromoResult] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [payLoading,   setPayLoading]  = useState(false);
  const [result,       setResult]      = useState(null);

  const finalAmount    = promoResult?.valid ? promoResult.discountedAmount : selPlan?.price;
  const discountAmount = promoResult?.valid ? promoResult.discountAmount   : 0;

  const resetAndClose = () => {
    setStep(1); setSelPlan(null); setPromoCode('');
    setPromoResult(null); setResult(null);
    onClose();
  };

  const validatePromo = async () => {
    if (!promoCode.trim() || !selPlan) return;
    setPromoLoading(true);
    try {
      const r = await api.post('/subscriptions/promo/validate', { code: promoCode.trim(), planId: selPlan._id });
      setPromoResult(r);
    } catch {
      setPromoResult({ valid: false, message: 'Could not validate. Try again.' });
    } finally { setPromoLoading(false); }
  };

  const handlePay = async () => {
    if (!selPlan) return;
    setPayLoading(true);
    try {
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

      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = resolve; s.onerror = reject;
          document.body.appendChild(s);
        });
      }

      const options = {
        key:         keyId,
        amount:      orderRes.amountInPaise,
        currency:    orderRes.currency || 'INR',
        name:        'NEO GEN Internship Engine',
        description: `${orderRes.planName} Subscription`,
        order_id:    orderRes.orderId,
        theme:       { color: '#FF9933' },
        modal: {
          ondismiss: () => {
            setPayLoading(false);
            toast('Payment cancelled. You can try again anytime.', { icon: 'ℹ️' });
          },
        },
        handler: async (response) => {
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
            await refresh();           // update SubscriptionContext
            if (onSubscribed) onSubscribed();
          } catch (err) {
            setResult({ success: false, message: err?.data?.message || 'Payment verification failed.' });
            setStep(3);
          } finally {
            setPayLoading(false);
          }
        },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      setPayLoading(false);
      toast.error(err?.data?.message || 'Could not initiate payment. Try again.');
    }
  };

  const featureMap = {
    atsAnalysis: 'ATS Score', aiResumeAnalysis: 'AI Analysis',
    aiReport: 'AI Report', premiumRecommendations: 'Premium Recs',
    aiChat: 'AI Chat', aiMatch: 'AI Match',
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.93, opacity: 0 }}
          animate={{ scale: 1,    opacity: 1 }}
          exit={{   scale: 0.93, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: '92vh' }}
        >
          {/* Header */}
          <div className="px-6 py-5 text-white flex-shrink-0" style={{ background: HEADER_GRADIENT }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown size={22} className="opacity-90" />
                <div>
                  <h2 className="text-lg font-black leading-tight">Premium Required</h2>
                  <p className="text-xs opacity-90 mt-0.5">
                    {step === 1 ? `Upgrade to access ${featureLabel}` :
                     step === 2 ? 'Review your order' : 'Payment status'}
                  </p>
                </div>
              </div>
              <button onClick={resetAndClose} className="p-1.5 rounded-full hover:bg-white/20">
                <XCircle size={20} />
              </button>
            </div>
            <Steps current={step} />
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* STEP 1 — Select plan */}
            {step === 1 && (
              <>
                <p className="text-sm text-gray-500 text-center">
                  You have used all <strong>{freeLimit}</strong> free AI analyses.
                  Choose a plan to continue.
                </p>
                {plans.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">Loading plans…</div>
                ) : plans.map(plan => {
                  const selected = selPlan?._id === plan._id;
                  return (
                    <button key={plan._id} type="button"
                      onClick={() => setSelPlan(plan)}
                      className={`w-full text-left rounded-xl p-4 border-2 transition-all ${
                        selected ? 'border-[#FF9933] bg-[#fff8f0] shadow-md' : 'border-gray-200 hover:border-[#FF9933]/50 bg-white'
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
                          const lbl = featureMap[k];
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

            {/* STEP 2 — Promo + Summary */}
            {step === 2 && selPlan && (
              <>
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
                      className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
                      style={{ background: '#fff0e0', color: '#e68a2e', border: '1px solid #FFD4A0' }}
                    >
                      {promoLoading ? '…' : 'Apply'}
                    </button>
                  </div>
                  {promoResult && (
                    <p className={`mt-1.5 text-xs font-semibold ${promoResult.valid ? 'text-[#138808]' : 'text-red-500'}`}>
                      {promoResult.valid ? `✓ ${promoResult.discountLabel} applied!` : `✗ ${promoResult.message}`}
                    </p>
                  )}
                </div>

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

          {/* Footer */}
          <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex gap-3 flex-shrink-0">
            {step === 1 && (
              <>
                <button onClick={resetAndClose}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Maybe Later
                </button>
                <button
                  disabled={!selPlan}
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                  style={{ background: selPlan ? BTN_GRADIENT : '#d1d5db' }}
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
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: BTN_GRADIENT }}
                >
                  {payLoading ? <><Loader2 size={16} className="animate-spin" /> Preparing…</> : <>Pay ₹{finalAmount}</>}
                </button>
              </>
            )}
            {step === 3 && (
              <button
                onClick={resetAndClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: result?.success ? '#138808' : '#6b7280' }}
              >
                {result?.success ? 'Start Using Premium' : 'Close'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UpgradeModal;
