import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';
import Card from '../../ui/Card';
import {
  CreditCard, Users, BarChart2, Settings, Plus, Edit2,
  Trash2, CheckCircle, XCircle, RefreshCw, AlertCircle,
  TrendingUp, Shield, Zap, Star, Crown, Clock, Tag, DollarSign, FileText,
} from 'lucide-react';

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const badge = (status) => {
  const map = {
    ACTIVE:    'bg-emerald-100 text-emerald-800',
    EXPIRED:   'bg-red-100    text-red-800',
    CANCELLED: 'bg-gray-100   text-gray-700',
    PENDING:   'bg-amber-100  text-amber-800',
    FAILED:    'bg-red-100    text-red-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
};

const TABS = ['Plans', 'Promos', 'Payments', 'Subscriptions', 'Templates', 'Analytics', 'Settings'];

// ═══════════════════════════════════════════════════════════════════
// Plans Tab
// ═══════════════════════════════════════════════════════════════════
const EMPTY_PLAN = {
  name: '', description: '', price: '', currency: 'INR', durationDays: '',
  isActive: true, displayOrder: 0,
  features: { atsAnalysis: true, aiResumeAnalysis: true, aiReport: true, premiumRecommendations: true, maxAnalysesPerMonth: 0 },
};

const PlansTab = () => {
  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);   // null | 'new' | planObject
  const [form,    setForm]    = useState({ ...EMPTY_PLAN });
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/subscriptions/admin/plans'); setPlans(r.plans || []); }
    catch { showToast('Failed to load plans', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setForm({ ...EMPTY_PLAN }); setEditing('new'); };
  const openEdit = (p) => { setForm({ ...p, features: { ...EMPTY_PLAN.features, ...(p.features || {}) } }); setEditing(p); };
  const cancel   = () => setEditing(null);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing === 'new') {
        await api.post('/subscriptions/admin/plans', form);
        showToast('Plan created');
      } else {
        await api.put(`/subscriptions/admin/plans/${editing._id}`, form);
        showToast('Plan updated');
      }
      setEditing(null);
      load();
    } catch (err) {
      showToast(err?.data?.message || 'Save failed', 'error');
    } finally { setSaving(false); }
  };

  const deletePlan = async (id) => {
    if (!window.confirm('Delete this plan? Cannot delete if active subscriptions exist.')) return;
    try { await api.delete(`/subscriptions/admin/plans/${id}`); showToast('Plan deleted'); load(); }
    catch (err) { showToast(err?.data?.message || 'Delete failed', 'error'); }
  };

  const featureLabel = { atsAnalysis:'ATS Analysis', aiResumeAnalysis:'AI Resume Analysis', aiReport:'AI Report', premiumRecommendations:'Premium Recommendations' };

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-semibold text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">Subscription Plans</h2>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
          <Plus size={16} /> New Plan
        </button>
      </div>

      {/* Plan form modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold">{editing === 'new' ? 'Create Plan' : `Edit: ${editing.name}`}</h3>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Monthly Pro" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <div className="flex">
                    <select value={form.currency} onChange={e => setForm(f => ({...f, currency: e.target.value}))}
                      className="border border-gray-300 rounded-l-lg px-2 py-2 text-sm bg-gray-50">
                      {['INR','USD','EUR'].map(c => <option key={c}>{c}</option>)}
                    </select>
                    <input required type="number" min="0" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))}
                      className="flex-1 border-t border-b border-r border-gray-300 rounded-r-lg px-3 py-2 text-sm" placeholder="99" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days) *</label>
                  <input required type="number" min="1" value={form.durationDays} onChange={e => setForm(f => ({...f, durationDays: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input type="number" min="0" value={form.displayOrder} onChange={e => setForm(f => ({...f, displayOrder: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({...f, isActive: e.target.checked}))} className="w-4 h-4 accent-indigo-600" />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (visible to students)</label>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Features Included</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(featureLabel).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="checkbox" className="accent-indigo-600"
                        checked={!!form.features?.[key]}
                        onChange={e => setForm(f => ({...f, features: {...f.features, [key]: e.target.checked}}))} />
                      {label}
                    </label>
                  ))}
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Max analyses/month (0 = unlimited)</label>
                    <input type="number" min="0" value={form.features?.maxAnalysesPerMonth ?? 0}
                      onChange={e => setForm(f => ({...f, features: {...f.features, maxAnalysesPerMonth: parseInt(e.target.value)||0}}))}
                      className="w-24 border border-gray-300 rounded px-2 py-1 text-sm" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving…' : (editing === 'new' ? 'Create Plan' : 'Update Plan')}
                </button>
                <button type="button" onClick={cancel} className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading plans…</div>
      ) : plans.length === 0 ? (
        <Card className="p-10 text-center">
          <Crown size={40} className="mx-auto text-indigo-300 mb-3" />
          <p className="text-gray-500 font-medium">No plans yet. Create your first plan.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map(p => (
            <div key={p._id} className={`rounded-xl border-2 p-5 ${p.isActive ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{p.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{p.description || 'No description'}</p>
                </div>
                {p.isActive
                  ? <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Active</span>
                  : <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">Inactive</span>}
              </div>
              <div className="text-2xl font-black text-indigo-700 mb-1">
                {p.currency} {p.price}
                <span className="text-sm font-medium text-gray-500 ml-1">/ {p.durationDays} days</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-3 mb-4">
                {Object.entries(p.features || {}).filter(([k,v]) => v === true).map(([k]) => (
                  <span key={k} className="text-xs bg-white border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{featureLabel[k] || k}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-white">
                  <Edit2 size={13} /> Edit
                </button>
                <button onClick={() => deletePlan(p._id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-red-200 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// Promos Tab
// ═══════════════════════════════════════════════════════════════════
const EMPTY_PROMO = {
  code: '', description: '', discountType: 'percent', discountValue: '',
  applicablePlanIds: [], isActive: true, usageLimit: 0, expiresAt: '',
};

const PromosTab = () => {
  const [promos,   setPromos]   = useState([]);
  const [plans,    setPlans]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState({ ...EMPTY_PROMO });
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);

  const showToast = (msg, type = 'success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, pl] = await Promise.all([
        api.get('/subscriptions/admin/promos'),
        api.get('/subscriptions/admin/plans'),
      ]);
      setPromos(pr.promos || []);
      setPlans(pl.plans || []);
    } catch { showToast('Failed to load promo codes','error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setForm({ ...EMPTY_PROMO }); setEditing('new'); };
  const openEdit = (p) => {
    setForm({
      ...p,
      expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString().split('T')[0] : '',
      applicablePlanIds: (p.applicablePlanIds || []).map(pl => pl._id || pl),
    });
    setEditing(p);
  };
  const cancel = () => setEditing(null);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase().trim(),
        expiresAt: form.expiresAt || null,
      };
      if (editing === 'new') {
        await api.post('/subscriptions/admin/promos', payload);
        showToast('Promo code created');
      } else {
        await api.put(`/subscriptions/admin/promos/${editing._id}`, payload);
        showToast('Promo code updated');
      }
      setEditing(null);
      load();
    } catch (err) { showToast(err?.data?.message || 'Save failed','error'); }
    finally { setSaving(false); }
  };

  const deletePromo = async (id) => {
    if (!window.confirm('Delete this promo code?')) return;
    try { await api.delete(`/subscriptions/admin/promos/${id}`); showToast('Promo code deleted'); load(); }
    catch (err) { showToast(err?.data?.message || 'Delete failed','error'); }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-semibold text-white ${toast.type==='error'?'bg-red-600':'bg-emerald-600'}`}>{toast.msg}</div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Tag size={18}/> Promo Codes</h2>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
          <Plus size={16}/> New Promo Code
        </button>
      </div>

      {/* Form modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold">{editing === 'new' ? 'Create Promo Code' : `Edit: ${editing.code}`}</h3>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code * <span className="text-xs text-gray-400">(auto uppercase)</span></label>
                <input required value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value.toUpperCase()}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono font-bold tracking-widest" placeholder="SAVE20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Summer discount" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
                  <select value={form.discountType} onChange={e=>setForm(f=>({...f,discountType:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value * {form.discountType === 'percent' ? '(0–100)' : '(₹)'}
                  </label>
                  <input required type="number" min="0" max={form.discountType==='percent'?100:undefined}
                    value={form.discountValue} onChange={e=>setForm(f=>({...f,discountValue:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder={form.discountType==='percent'?'20':'50'} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit <span className="text-xs text-gray-400">(0=unlimited)</span></label>
                  <input type="number" min="0" value={form.usageLimit} onChange={e=>setForm(f=>({...f,usageLimit:parseInt(e.target.value)||0}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expires On</label>
                  <input type="date" value={form.expiresAt}
                    onChange={e=>setForm(f=>({...f,expiresAt:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid for Plans <span className="text-xs text-gray-400">(none selected = all plans)</span></label>
                <div className="flex flex-wrap gap-2">
                  {plans.map(p => (
                    <label key={p._id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="checkbox" className="accent-indigo-600"
                        checked={form.applicablePlanIds.includes(p._id)}
                        onChange={e => setForm(f => ({
                          ...f,
                          applicablePlanIds: e.target.checked
                            ? [...f.applicablePlanIds, p._id]
                            : f.applicablePlanIds.filter(id => id !== p._id),
                        }))} />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="promoActive" checked={form.isActive} onChange={e=>setForm(f=>({...f,isActive:e.target.checked}))} className="accent-indigo-600 w-4 h-4"/>
                <label htmlFor="promoActive" className="text-sm font-medium text-gray-700">Active (usable by students)</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving…' : editing === 'new' ? 'Create Code' : 'Update Code'}
                </button>
                <button type="button" onClick={cancel} className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>{['Code','Type','Discount','Used','Limit','Expiry','Status','Actions'].map(h=>(
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : promos.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No promo codes yet. Create one above.</td></tr>
              ) : promos.map(p => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-indigo-700 tracking-wider">{p.code}</td>
                  <td className="px-4 py-3 whitespace-nowrap capitalize text-gray-600">{p.discountType}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-semibold text-emerald-700">
                    {p.discountType === 'percent' ? `${p.discountValue}%` : `₹${p.discountValue}`} off
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">{p.usedCount}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{p.usageLimit === 0 ? '∞' : p.usageLimit}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">{p.expiresAt ? fmt(p.expiresAt) : 'No expiry'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {p.isActive
                      ? <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Active</span>
                      : <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">Inactive</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"><Edit2 size={14}/></button>
                      <button onClick={() => deletePromo(p._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// Payments Tab
// ═══════════════════════════════════════════════════════════════════
const PaymentsTab = () => {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter ? `/subscriptions/admin/payments?status=${filter}` : '/subscriptions/admin/payments';
      const r = await api.get(url);
      setPayments(r.payments || []);
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const payBadge = (status) => {
    const map = { SUCCESS:'bg-emerald-100 text-emerald-800', CREATED:'bg-amber-100 text-amber-800', FAILED:'bg-red-100 text-red-800', CANCELLED:'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status]||'bg-gray-100 text-gray-600'}`}>{status}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><DollarSign size={18}/> Payments</h2>
        <div className="flex gap-2">
          <select value={filter} onChange={e=>setFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            <option value="">All Statuses</option>
            {['SUCCESS','CREATED','FAILED','CANCELLED'].map(s=><option key={s}>{s}</option>)}
          </select>
          <button onClick={load} className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"><RefreshCw size={15}/></button>
        </div>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>{['Student','Plan','Original','Discount','Final','Promo','Status','Gateway Order','Date'].map(h=>(
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No payments found.</td></tr>
              ) : payments.map(p => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium text-gray-900">{p.userId?.name||'—'}</p>
                    <p className="text-xs text-gray-500">{p.userId?.email||'—'}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">{p.planId?.name||'—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">₹{p.originalAmount||p.amount}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-emerald-700 font-semibold">{p.discountAmount>0?`-₹${p.discountAmount}`:'—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900">₹{p.amount}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {p.promoCodeStr ? <span className="font-mono text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">{p.promoCodeStr}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{payBadge(p.status)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 font-mono max-w-[120px] truncate">{p.razorpayOrderId||'—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">{fmt(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// Templates Tab — Super Admin controls which templates are FREE/PREMIUM
// ═══════════════════════════════════════════════════════════════════
const TemplatesTab = () => {
  const [templates, setTemplates] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(null); // templateId being saved
  const [toast,     setToast]     = useState(null);

  const showToast = (msg, type = 'success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/resume-templates/admin/config');
      setTemplates(r.templates || []);
    } catch { showToast('Failed to load template config','error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (templateId, currentAccess) => {
    const newAccess = currentAccess === 'FREE' ? 'PREMIUM' : 'FREE';
    setSaving(templateId);
    try {
      await api.put(`/resume-templates/admin/config/${templateId}`, { access: newAccess });
      setTemplates(prev => prev.map(t => t.templateId === templateId ? { ...t, access: newAccess } : t));
      showToast(`"${templateId}" is now ${newAccess}`);
    } catch (err) { showToast(err?.data?.message || 'Update failed','error'); }
    finally { setSaving(null); }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-semibold text-white ${toast.type==='error'?'bg-red-600':'bg-emerald-600'}`}>{toast.msg}</div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><FileText size={18}/> Resume Template Access</h2>
          <p className="text-sm text-gray-500 mt-0.5">Toggle which templates are FREE (no subscription) vs PREMIUM (subscription required).</p>
        </div>
        <button onClick={load} className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"><RefreshCw size={15}/></button>
      </div>

      <Card className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['#','Template','Current Access','Action'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : templates.map(t => (
              <tr key={t.templateId} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-500 font-medium">{t.displayOrder}</td>
                <td className="px-5 py-3">
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{t.templateId}</p>
                </td>
                <td className="px-5 py-3">
                  {t.access === 'FREE' ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">FREE</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 flex items-center gap-1 w-fit">
                      <Crown size={10}/> PREMIUM
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <button
                    disabled={saving === t.templateId}
                    onClick={() => toggle(t.templateId, t.access)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
                      t.access === 'FREE'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {saving === t.templateId ? 'Saving…' : t.access === 'FREE' ? 'Make Premium' : 'Make Free'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        <strong>Note:</strong> Changes take effect immediately for all students. The backend is the source of truth — frontend config in <code>resumeTemplates.js</code> shows default badges but the backend config overrides access control.
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// Subscriptions Tab
// ═══════════════════════════════════════════════════════════════════
const SubscriptionsTab = () => {
  const [subs,    setSubs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('');
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type = 'success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter ? `/subscriptions/admin/subscriptions?status=${filter}` : '/subscriptions/admin/subscriptions';
      const r = await api.get(url);
      setSubs(r.subscriptions || []);
    } catch { showToast('Failed to load subscriptions','error'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const activate = async (id) => {
    try { await api.put(`/subscriptions/admin/subscriptions/${id}/activate`, {}); showToast('Activated'); load(); }
    catch (err) { showToast(err?.data?.message || 'Failed','error'); }
  };
  const cancel = async (id) => {
    if (!window.confirm('Cancel this subscription?')) return;
    try { await api.put(`/subscriptions/admin/subscriptions/${id}/cancel`, {}); showToast('Cancelled'); load(); }
    catch (err) { showToast(err?.data?.message || 'Failed','error'); }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-semibold text-white ${toast.type==='error'?'bg-red-600':'bg-emerald-600'}`}>{toast.msg}</div>
      )}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">All Subscriptions</h2>
        <div className="flex gap-2 items-center">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            <option value="">All Statuses</option>
            {['ACTIVE','PENDING','EXPIRED','CANCELLED','FAILED'].map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={load} className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"><RefreshCw size={15}/></button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>{['Student','Plan','Status','Start','Expires','Free Used','Premium Used','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : subs.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No subscriptions found.</td></tr>
              ) : subs.map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium text-gray-900">{s.userId?.name || '—'}</p>
                    <p className="text-xs text-gray-500">{s.userId?.email || '—'}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium">{s.planId?.name || s.planSnapshot?.name || '—'}</p>
                    <p className="text-xs text-gray-500">{s.currency} {s.amount}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{badge(s.status)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">{fmt(s.startedAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">{fmt(s.expiresAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-indigo-700">{s.usage?.freeUsed ?? '—'}</span>
                    <span className="text-gray-400">/{s.usage?.freeLimit ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-purple-700">{s.usage?.premiumUsed ?? '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-1.5">
                      {s.status === 'PENDING' && (
                        <button onClick={() => activate(s._id)}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold hover:bg-emerald-100">
                          Activate
                        </button>
                      )}
                      {s.status === 'ACTIVE' && (
                        <button onClick={() => cancel(s._id)}
                          className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-semibold hover:bg-red-100">
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// Analytics Tab
// ═══════════════════════════════════════════════════════════════════
const AnalyticsTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/subscriptions/admin/analytics')
      .then(r => setData(r.analytics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading analytics…</div>;
  if (!data)   return <div className="text-center py-16 text-gray-400">No analytics available.</div>;

  const stats = [
    { label: 'Total Students',     value: data.totalStudents,                  icon: Users,      color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Subscribers', value: data.subscriptions.active,            icon: Crown,      color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Expired',            value: data.subscriptions.expired,           icon: Clock,      color: 'bg-amber-50 text-amber-600' },
    { label: 'Pending Payments',   value: data.subscriptions.pending,           icon: AlertCircle,color: 'bg-orange-50 text-orange-600' },
    { label: 'Free Checks Used',   value: data.usage.totalFreeChecks,           icon: Zap,        color: 'bg-violet-50 text-violet-600' },
    { label: 'Premium Checks',     value: data.usage.totalPremiumChecks,        icon: Star,       color: 'bg-purple-50 text-purple-600' },
    { label: 'Students w/ Usage',  value: data.usage.studentsWithUsage,         icon: TrendingUp, color: 'bg-teal-50 text-teal-600' },
    { label: 'Cancelled',          value: data.subscriptions.cancelled,         icon: XCircle,    color: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-900">Usage Analytics</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mb-3`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-black text-gray-900">{value ?? 0}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {data.planBreakdown?.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><BarChart2 size={18} /> Active Subscriptions by Plan</h3>
          <div className="space-y-3">
            {data.planBreakdown.map(p => (
              <div key={p._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="font-medium text-gray-800">{p.planName || 'Unknown Plan'}</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-indigo-700 font-semibold">{p.count} active</span>
                  <span className="text-emerald-700 font-semibold">₹{(p.revenue || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// Settings Tab
// ═══════════════════════════════════════════════════════════════════
const SettingsTab = () => {
  const [settings, setSettings] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  useEffect(() => {
    api.get('/subscriptions/admin/settings')
      .then(r => setSettings(r.settings))
      .catch(() => showToast('Failed to load settings','error'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.put('/subscriptions/admin/settings', settings);
      setSettings(r.settings);
      showToast('Settings saved');
    } catch (err) { showToast(err?.data?.message || 'Save failed','error'); }
    finally { setSaving(false); }
  };

  // Toggle a single feature gate
  const toggleFeature = async (key) => {
    const newVal = !settings[key];
    const optimistic = { ...settings, [key]: newVal };
    setSettings(optimistic);
    try {
      const r = await api.put('/subscriptions/admin/settings', { [key]: newVal });
      setSettings(r.settings);
      showToast(`${key.replace('feature_','')} → ${newVal ? 'SUBSCRIPTION REQUIRED' : 'FREE TIER'}`);
    } catch (err) {
      setSettings(settings); // revert
      showToast(err?.data?.message || 'Toggle failed','error');
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">Loading settings…</div>;

  // All AI feature gates
  const FEATURE_GATES = [
    { key: 'feature_atsAnalysis',            label: 'ATS Resume Analysis',         desc: 'POST /api/resume/upload — ATS score on uploaded resume',             icon: '📄' },
    { key: 'feature_aiResumeAnalysis',       label: 'AI Resume Analysis',           desc: 'POST /api/ai/analyze — full AI analysis pipeline',                   icon: '🤖' },
    { key: 'feature_aiReport',               label: 'AI Intelligence Report',       desc: 'GET  /api/ai/intelligence — career prediction & section scores',      icon: '📊' },
    { key: 'feature_premiumRecommendations', label: 'AI Internship Recommendations',desc: 'GET  /api/ai/recommendations — semantic internship matching',          icon: '🎯' },
    { key: 'feature_aiChat',                 label: 'AI Chat Assistant',            desc: 'POST /api/ai/chat — NeoGen AI coaching chatbot',                      icon: '💬' },
    { key: 'feature_aiMatch',                label: 'AI Internship Match',          desc: 'POST /api/ai/match/:id — single-internship semantic compatibility',   icon: '🔍' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-semibold text-white ${toast.type==='error'?'bg-red-600':'bg-emerald-600'}`}>{toast.msg}</div>
      )}

      {/* ── Free limit ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <form onSubmit={save} className="space-y-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-3">Free Tier Limit</h3>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Free AI Analyses per Student
            </label>
            <p className="text-xs text-gray-400 mb-2">Number of free attempts before subscription is required (per feature gate below).</p>
            <input
              type="number" min="0" max="100"
              value={settings?.freeResumeLimit ?? 2}
              onChange={e => setSettings(s => ({...s, freeResumeLimit: parseInt(e.target.value)||0}))}
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold"
            />
          </div>
          <button type="submit" disabled={saving}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Free Limit'}
          </button>
        </form>
      </div>

      {/* ── Per-feature AI subscription gates ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="text-sm font-bold text-gray-900">AI Feature Subscription Gates</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Toggle ON → subscription required for that feature (free tier bypass disabled).<br/>
            Toggle OFF → free tier still applies (students get {settings?.freeResumeLimit ?? 2} free attempts).
          </p>
        </div>
        <div className="divide-y divide-gray-50">
          {FEATURE_GATES.map(({ key, label, desc, icon }) => {
            const isOn = !!settings?.[key];
            return (
              <div key={key} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50">
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 truncate">{desc}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    isOn ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {isOn ? '🔒 Sub Required' : '✓ Free Tier'}
                  </span>
                  {/* Toggle switch */}
                  <button
                    type="button"
                    onClick={() => toggleFeature(key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      isOn ? 'bg-amber-500' : 'bg-gray-200'
                    }`}
                    aria-label={`Toggle ${label}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      isOn ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
        <strong>Note:</strong> Changes take effect immediately — no restart required. Backend reads these settings from the database on every request.
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════
const SubscriptionManagement = () => {
  const [activeTab, setActiveTab] = useState('Plans');

  const tabIcon = { Plans: CreditCard, Subscriptions: Users, Analytics: BarChart2, Settings };
  const Icon = tabIcon[activeTab] || CreditCard;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="text-indigo-600" size={26} />
            Subscription Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage plans, subscriptions, analytics and settings.</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => {
          const TIcon = { Plans: CreditCard, Promos: Tag, Payments: DollarSign, Subscriptions: Users, Templates: FileText, Analytics: BarChart2, Settings: Settings }[tab];
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${activeTab === tab ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              <TIcon size={15} /> {tab}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'Plans'         && <PlansTab />}
      {activeTab === 'Promos'        && <PromosTab />}
      {activeTab === 'Payments'      && <PaymentsTab />}
      {activeTab === 'Subscriptions' && <SubscriptionsTab />}
      {activeTab === 'Templates'     && <TemplatesTab />}
      {activeTab === 'Analytics'     && <AnalyticsTab />}
      {activeTab === 'Settings'      && <SettingsTab />}
    </div>
  );
};

export default SubscriptionManagement;
