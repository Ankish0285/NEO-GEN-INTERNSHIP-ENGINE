import React, { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Save, Upload, Globe, Image, FileText, Mail, Share2, Scale, Users, Plus, Trash2 } from 'lucide-react';
import Card from '../../ui/Card';
import SiteSettingsService from '../../../services/siteSettingsService';
import { useAuth } from '../../../context/AuthContext';
import { useSiteSettings } from '../../../context/SiteSettingsContext';
import { resolveStoryImageUrl } from '../../../utils/resolveStoryImageUrl';
import { mergeSiteSettings, buildSiteSettingsPayload } from '../../../utils/defaultSiteSettings';

const TABS = [
  { id: 'branding', label: 'Logo & Brand', icon: Image },
  { id: 'hero', label: 'Home Hero', icon: Globe },
  { id: 'about', label: 'About', icon: FileText },
  { id: 'howItWorks', label: 'How It Works', icon: FileText },
  { id: 'contact', label: 'Contact', icon: Mail },
  { id: 'footer', label: 'Footer & Social', icon: Share2 },
  { id: 'resources', label: 'Resources', icon: FileText },
  { id: 'policies', label: 'Policies', icon: Scale },
  { id: 'team', label: 'Built By', icon: Users },
];

const Field = ({ label, children, hint }) => (
  <div className="space-y-2">
    <label className="admin-label">{label}</label>
    {children}
    {hint && <p className="admin-hint">{hint}</p>}
  </div>
);

const TextInput = ({ value, onChange, ...props }) => (
  <input
    className="admin-input"
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    {...props}
  />
);

const TextArea = ({ value, onChange, rows = 3, ...props }) => (
  <textarea
    className="admin-input"
    rows={rows}
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    {...props}
  />
);

const WebsiteCMS = () => {
  const { user, loading: authLoading } = useAuth();
  const { settings, loading, applySettings, refresh } = useSiteSettings();
  const [draft, setDraft] = useState(() => mergeSiteSettings(null));
  const [activeTab, setActiveTab] = useState('branding');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const addUrlInputRef = React.useRef(null);
  const addFileInputRef = React.useRef(null);

  useEffect(() => {
    if (!loading && !dirty) {
      setDraft(JSON.parse(JSON.stringify(mergeSiteSettings(settings))));
    }
  }, [loading, settings, dirty]);

  const patch = (section, key, value) => {
    setDirty(true);
    setDraft((prev) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [key]: value },
    }));
  };

  const patchNested = (section, sub, key, value) => {
    setDirty(true);
    setDraft((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [sub]: { ...(prev[section]?.[sub] || {}), [key]: value },
      },
    }));
  };

  const patchArrayItem = (section, arrayKey, index, key, value) => {
    setDirty(true);
    setDraft((prev) => {
      const sectionData = prev[section] || {};
      const arr = [...(sectionData[arrayKey] || [])];
      arr[index] = key === null ? value : { ...arr[index], [key]: value };
      return { ...prev, [section]: { ...sectionData, [arrayKey]: arr } };
    });
  };

  const addArrayItem = (section, arrayKey, item) => {
    setDirty(true);
    setDraft((prev) => {
      const sectionData = prev[section] || {};
      const baseImages = Array.isArray(sectionData[arrayKey])
        ? sectionData[arrayKey]
        : section === 'hero' && arrayKey === 'backgroundImages' && sectionData.backgroundImage
        ? [sectionData.backgroundImage]
        : [];
      const arr = [...baseImages, item];
      return { ...prev, [section]: { ...sectionData, [arrayKey]: arr } };
    });
  };

  const addArrayItemAtStart = (section, arrayKey, item) => {
    setDirty(true);
    setDraft((prev) => {
      const sectionData = prev[section] || {};
      const baseImages = Array.isArray(sectionData[arrayKey])
        ? sectionData[arrayKey]
        : section === 'hero' && arrayKey === 'backgroundImages' && sectionData.backgroundImage
        ? [sectionData.backgroundImage]
        : [];
      const arr = [item, ...baseImages];
      return { ...prev, [section]: { ...sectionData, [arrayKey]: arr } };
    });
  };

  const removeArrayItem = (section, arrayKey, index) => {
    setDirty(true);
    setDraft((prev) => {
      const sectionData = prev[section] || {};
      const arr = (sectionData[arrayKey] || []).filter((_, i) => i !== index);
      return { ...prev, [section]: { ...sectionData, [arrayKey]: arr } };
    });
  };

  const handleUpload = async (e, onUrl) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await SiteSettingsService.uploadImage(file);
      onUrl(res.url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = buildSiteSettingsPayload(draft);
      const res = await SiteSettingsService.update(payload);
      const merged = applySettings(res.settings);
      setDraft(JSON.parse(JSON.stringify(merged)));
      setDirty(false);
      await refresh();
      toast.success('Website updated — scroll to the bottom of the home page to see Built By');
    } catch (err) {
      const msg = err.data?.message || err.message || 'Failed to save';
      if (err.status === 404 || String(msg).includes('404')) {
        toast.error('API not found. Restart the backend server (npm start in backend folder), then try again.');
      } else if (msg.includes('Admin') || msg.includes('authorized') || err.status === 401 || err.status === 403) {
        toast.error('Super Admin login required. Sign in at /login and try again.');
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const heroImages = useMemo(() => {
    const images = Array.isArray(draft.hero?.backgroundImages)
      ? [...draft.hero.backgroundImages]
      : [];
    if (draft.hero?.backgroundImage && !images.includes(draft.hero.backgroundImage)) {
      images.unshift(draft.hero.backgroundImage);
    }
    return images.filter((img) => !!img);
  }, [draft.hero?.backgroundImages, draft.hero?.backgroundImage]);

  const logoPreview = draft.branding?.logoUrl
    ? resolveStoryImageUrl(draft.branding.logoUrl) || draft.branding.logoUrl
    : null;
  const heroPreview = heroImages[0]
    ? resolveStoryImageUrl(heroImages[0]) || heroImages[0]
    : null;

  if (!authLoading && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div className="neo-page-header mb-0">
          <h1>Website Control</h1>
          <p>
            Manage the public website — logo, home, about, contact, social links, and policies.
          </p>
        </div>
        <button type="button" onClick={handleSave} disabled={saving} className="admin-btn-primary shrink-0">
          <Save size={18} />
          {saving ? 'Publishing...' : 'Publish changes'}
        </button>
      </div>

      <div className="neo-tabs admin-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={activeTab === id ? 'neo-tab neo-tab--active admin-tab admin-tab--active' : 'neo-tab admin-tab'}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <Card variant="admin" className="p-6 md:p-8">
        {activeTab === 'branding' && (
          <div className="grid gap-6 max-w-2xl">
            <Field label="Logo image">
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain rounded border" />
                )}
                <label className="admin-btn-ghost cursor-pointer inline-flex items-center gap-2">
                  <Upload size={16} />
                  {uploading ? 'Uploading...' : 'Upload logo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => handleUpload(e, (url) => patch('branding', 'logoUrl', url))}
                  />
                </label>
              </div>
              <TextInput
                value={draft.branding.logoUrl}
                onChange={(v) => patch('branding', 'logoUrl', v)}
                placeholder="Or paste image URL"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Brand name (line 1)">
                <TextInput value={draft.branding.brandNameLine1} onChange={(v) => patch('branding', 'brandNameLine1', v)} />
              </Field>
              <Field label="Brand name (line 2)">
                <TextInput value={draft.branding.brandNameLine2} onChange={(v) => patch('branding', 'brandNameLine2', v)} />
              </Field>
            </div>
            <Field label="Subtitle (under logo)">
              <TextInput value={draft.branding.brandSubtitle} onChange={(v) => patch('branding', 'brandSubtitle', v)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Primary color (hex)">
                <TextInput value={draft.branding.primaryColor} onChange={(v) => patch('branding', 'primaryColor', v)} />
              </Field>
              <Field label="Secondary color (hex)">
                <TextInput value={draft.branding.secondaryColor} onChange={(v) => patch('branding', 'secondaryColor', v)} />
              </Field>
            </div>
          </div>
        )}

        {activeTab === 'hero' && (
          <div className="grid gap-6 max-w-2xl">
            <Field label="Hero background images">
              {heroPreview && (
                <img src={heroPreview} alt="Hero" className="w-full max-h-40 object-cover rounded-lg mb-2" />
              )}
              <p className="text-sm text-gray-500 mb-3">
                {heroImages.length > 0
                  ? `${heroImages.length} image${heroImages.length === 1 ? '' : 's'} added`
                  : 'No hero images added yet.'}
              </p>
              {heroImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto mb-3">
                  {heroImages.map((imageUrl, index) => (
                    <img
                      key={index}
                      src={resolveStoryImageUrl(imageUrl) || imageUrl}
                      alt={`Hero slide ${index + 1}`}
                      className="h-20 w-32 rounded-lg object-cover border"
                    />
                  ))}
                </div>
              )}
              {heroImages.map((imageUrl, index) => (
                <div key={index} className="grid grid-cols-[1fr_auto] gap-3 items-center mb-3">
                  <TextInput
                    value={imageUrl}
                    onChange={(v) => patchArrayItem('hero', 'backgroundImages', index, null, v)}
                    placeholder={`Hero image ${index + 1} URL`}
                  />
                  <button
                    type="button"
                    className="admin-btn-ghost text-sm px-3 py-2"
                    onClick={() => removeArrayItem('hero', 'backgroundImages', index)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPanel((s) => {
                      const next = !s;
                      if (!s) {
                        setTimeout(() => addUrlInputRef.current?.focus(), 60);
                      }
                      return next;
                    });
                  }}
                  className="admin-btn-primary"
                >
                  {showAddPanel ? 'Close' : 'Add image'}
                </button>
              </div>

              {showAddPanel && (
                <div className="mt-3 space-y-3">
                  <div className="flex gap-3">
                    <TextInput
                      ref={addUrlInputRef}
                      value={heroImageUrl}
                      onChange={(v) => setHeroImageUrl(v)}
                      placeholder="Paste image URL to add"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = heroImageUrl.trim();
                        if (!trimmed) return;
                        addArrayItemAtStart('hero', 'backgroundImages', trimmed);
                        setHeroImageUrl('');
                        setShowAddPanel(false);
                      }}
                      className="admin-btn-primary"
                    >
                      Add image
                    </button>
                  </div>
                  <div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                      <Upload size={16} />
                      Upload image
                      <input
                        ref={addFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => handleUpload(e, (url) => { addArrayItemAtStart('hero', 'backgroundImages', url); setShowAddPanel(false); })}
                      />
                    </label>
                  </div>
                </div>
              )}
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 mt-3">
                <Upload size={16} />
                Upload hero image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => handleUpload(e, (url) => addArrayItem('hero', 'backgroundImages', url))}
                />
              </label>
            </Field>
            <Field label="Title (before highlights)">
              <TextInput value={draft.hero.titleBefore} onChange={(v) => patch('hero', 'titleBefore', v)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Highlight word 1">
                <TextInput value={draft.hero.titleHighlight1} onChange={(v) => patch('hero', 'titleHighlight1', v)} />
              </Field>
              <Field label="Highlight word 2">
                <TextInput value={draft.hero.titleHighlight2} onChange={(v) => patch('hero', 'titleHighlight2', v)} />
              </Field>
            </div>
            <Field label="Subtitle">
              <TextArea value={draft.hero.subtitle} onChange={(v) => patch('hero', 'subtitle', v)} rows={3} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Primary button text">
                <TextInput value={draft.hero.primaryButtonText} onChange={(v) => patch('hero', 'primaryButtonText', v)} />
              </Field>
              <Field label="Secondary button text">
                <TextInput value={draft.hero.secondaryButtonText} onChange={(v) => patch('hero', 'secondaryButtonText', v)} />
              </Field>
            </div>
            <Field label="Image overlay darkness (0–0.9)">
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.05"
                value={draft.hero.overlayOpacity ?? 0.7}
                onChange={(e) => patch('hero', 'overlayOpacity', parseFloat(e.target.value))}
                className="w-full"
              />
            </Field>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="grid gap-6 max-w-3xl">
            <Field label="Intro paragraph">
              <TextArea value={draft.about.intro} onChange={(v) => patch('about', 'intro', v)} rows={4} />
            </Field>
            <Field label="Mission title">
              <TextInput value={draft.about.missionTitle} onChange={(v) => patch('about', 'missionTitle', v)} />
            </Field>
            <Field label="Mission text">
              <TextArea value={draft.about.missionText} onChange={(v) => patch('about', 'missionText', v)} rows={3} />
            </Field>
            <Field label="Partnerships title">
              <TextInput value={draft.about.partnershipsTitle} onChange={(v) => patch('about', 'partnershipsTitle', v)} />
            </Field>
            <Field label="Partnerships text">
              <TextArea value={draft.about.partnershipsText} onChange={(v) => patch('about', 'partnershipsText', v)} rows={3} />
            </Field>
            <h3 className="font-semibold text-gray-800">Feature cards (4)</h3>
            {(draft.about.features || []).map((f, i) => (
              <div key={i} className="admin-form-section space-y-3">
                <p className="text-xs font-bold text-gray-500">Feature {i + 1}</p>
                <TextInput value={f.title} onChange={(v) => patchArrayItem('about', 'features', i, 'title', v)} placeholder="Title" />
                <TextArea value={f.description} onChange={(v) => patchArrayItem('about', 'features', i, 'description', v)} rows={2} />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'howItWorks' && (
          <div className="grid gap-6 max-w-3xl">
            <Field label="Section title">
              <TextInput value={draft.howItWorks.title} onChange={(v) => patch('howItWorks', 'title', v)} />
            </Field>
            <Field label="Section subtitle">
              <TextArea value={draft.howItWorks.subtitle} onChange={(v) => patch('howItWorks', 'subtitle', v)} />
            </Field>
            {(draft.howItWorks.steps || []).map((step, i) => (
              <div key={i} className="admin-form-section space-y-3">
                <p className="text-xs font-bold text-gray-500">Step {i + 1}</p>
                <TextInput value={step.title} onChange={(v) => patchArrayItem('howItWorks', 'steps', i, 'title', v)} />
                <TextArea value={step.description} onChange={(v) => patchArrayItem('howItWorks', 'steps', i, 'description', v)} rows={2} />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="grid gap-4 max-w-2xl">
            <Field label="Section title"><TextInput value={draft.contact.title} onChange={(v) => patch('contact', 'title', v)} /></Field>
            <Field label="Section subtitle"><TextArea value={draft.contact.subtitle} onChange={(v) => patch('contact', 'subtitle', v)} /></Field>
            <Field label="Email"><TextInput value={draft.contact.email} onChange={(v) => patch('contact', 'email', v)} /></Field>
            <Field label="Phone"><TextInput value={draft.contact.phone} onChange={(v) => patch('contact', 'phone', v)} /></Field>
            <Field label="Toll-free"><TextInput value={draft.contact.phoneTollFree} onChange={(v) => patch('contact', 'phoneTollFree', v)} /></Field>
            <Field label="Address line 1"><TextInput value={draft.contact.addressLine1} onChange={(v) => patch('contact', 'addressLine1', v)} /></Field>
            <Field label="Address line 2"><TextInput value={draft.contact.addressLine2} onChange={(v) => patch('contact', 'addressLine2', v)} /></Field>
            <Field label="Address line 3"><TextInput value={draft.contact.addressLine3} onChange={(v) => patch('contact', 'addressLine3', v)} /></Field>
            <Field label="Support hours" hint="Use Enter for new lines">
              <TextArea value={draft.contact.supportHours} onChange={(v) => patch('contact', 'supportHours', v)} rows={3} />
            </Field>
          </div>
        )}

        {activeTab === 'footer' && (
          <div className="grid gap-6 max-w-2xl">
            <Field label="Footer description">
              <TextArea value={draft.footer.description} onChange={(v) => patch('footer', 'description', v)} rows={3} />
            </Field>
            <Field label="Copyright text">
              <TextInput value={draft.footer.copyright} onChange={(v) => patch('footer', 'copyright', v)} />
            </Field>
            <h3 className="font-semibold text-gray-800 pt-4 border-t">Social media links</h3>
            {['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'].map((key) => (
              <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
                <TextInput value={draft.social?.[key] ?? ''} onChange={(v) => patch('social', key, v)} placeholder="https://..." />
              </Field>
            ))}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="grid gap-4 max-w-2xl">
            <Field label="Title"><TextInput value={draft.resources.title} onChange={(v) => patch('resources', 'title', v)} /></Field>
            <Field label="Subtitle"><TextArea value={draft.resources.subtitle} onChange={(v) => patch('resources', 'subtitle', v)} /></Field>
            <Field label="CTA button text"><TextInput value={draft.resources.ctaText} onChange={(v) => patch('resources', 'ctaText', v)} /></Field>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="grid gap-6 max-w-3xl">
            <Field label="Section title">
              <TextInput value={draft.team?.title} onChange={(v) => patch('team', 'title', v)} />
            </Field>
            <Field label="Section subtitle">
              <TextArea value={draft.team?.subtitle} onChange={(v) => patch('team', 'subtitle', v)} rows={2} />
            </Field>

            <p className="admin-hint">
              Only Super Admin can edit this section. After saving, open the home page and scroll past Policies to see it.
            </p>
            <div className="flex items-center justify-between pt-2 border-t">
              <h3 className="font-semibold text-gray-800">Team members</h3>
              <button
                type="button"
                className="admin-btn-ghost inline-flex items-center gap-2 text-sm"
                onClick={() =>
                  addArrayItem('team', 'members', {
                    name: '',
                    position: '',
                    note: '',
                    photoUrl: '',
                  })
                }
              >
                <Plus size={16} />
                Add member
              </button>
            </div>

            {(draft.team?.members || []).length === 0 && (
              <p className="admin-hint">No members yet. Click &quot;Add member&quot; to show who built the platform on the home page.</p>
            )}

            {(draft.team?.members || []).map((member, i) => {
              const photoPreview = member.photoUrl
                ? resolveStoryImageUrl(member.photoUrl) || member.photoUrl
                : null;
              return (
                <div key={i} className="admin-form-section space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-500">Member {i + 1}</p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                      onClick={() => removeArrayItem('team', 'members', i)}
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                  <Field label="Photo">
                    <div className="flex items-center gap-4">
                      {photoPreview && (
                        <img
                          src={photoPreview}
                          alt={member.name || 'Member'}
                          className="w-16 h-16 rounded-full object-cover border"
                        />
                      )}
                      <label className="admin-btn-ghost cursor-pointer inline-flex items-center gap-2">
                        <Upload size={16} />
                        {uploading ? 'Uploading...' : 'Upload photo'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) =>
                            handleUpload(e, (url) => patchArrayItem('team', 'members', i, 'photoUrl', url))
                          }
                        />
                      </label>
                    </div>
                    <TextInput
                      value={member.photoUrl}
                      onChange={(v) => patchArrayItem('team', 'members', i, 'photoUrl', v)}
                      placeholder="Or paste image URL"
                    />
                  </Field>
                  <Field label="Name">
                    <TextInput
                      value={member.name}
                      onChange={(v) => patchArrayItem('team', 'members', i, 'name', v)}
                      placeholder="e.g. Ankish Kumar"
                    />
                  </Field>
                  <Field label="Position / role">
                    <TextInput
                      value={member.position}
                      onChange={(v) => patchArrayItem('team', 'members', i, 'position', v)}
                      placeholder="e.g. Full Stack Developer"
                    />
                  </Field>
                  <Field label="Short note">
                    <TextArea
                      value={member.note}
                      onChange={(v) => patchArrayItem('team', 'members', i, 'note', v)}
                      rows={2}
                      placeholder="A brief line about their contribution"
                    />
                  </Field>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="grid gap-8 max-w-3xl">
            {['privacy', 'terms', 'cookies'].map((key) => (
              <div key={key} className="admin-form-section space-y-3">
                <h3 className="font-semibold capitalize">{key} policy</h3>
                <Field label="Title">
                  <TextInput
                    value={draft.policies?.[key]?.title ?? ''}
                    onChange={(v) => patchNested('policies', key, 'title', v)}
                  />
                </Field>
                <Field label="Subtitle">
                  <TextInput
                    value={draft.policies?.[key]?.subtitle ?? ''}
                    onChange={(v) => patchNested('policies', key, 'subtitle', v)}
                  />
                </Field>
                <Field label="Body" hint="Separate paragraphs with a blank line">
                  <TextArea
                    value={draft.policies?.[key]?.body ?? ''}
                    onChange={(v) => patchNested('policies', key, 'body', v)}
                    rows={6}
                  />
                </Field>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default WebsiteCMS;
