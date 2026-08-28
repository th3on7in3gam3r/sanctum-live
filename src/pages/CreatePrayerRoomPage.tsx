import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { slugify, suggestAlternativeSlug } from '../lib/utils';
import { createPrayerRoomSchema } from '../lib/validations/prayerRoom';
import { formatClockTime, parseClockTime } from '../services/sessionScheduler';
import { BackButton } from '../components/common/BackButton';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { LogoUrlField, isHttpUrl } from '../components/common/LogoUrlField';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { useTour } from '../hooks/useTour';
import { TOUR_IDS } from '../tour/tourIds';
import { createRoomTourSteps } from '../tour/createRoomTour';
import { isPastorJourneyComplete } from '../tour/pastorJourney/storage';
import { Save, Radio, Shield, Users, Clock, AlertCircle, CircleHelp } from 'lucide-react';

interface CreatePrayerRoomPageProps {
  onNavigate: (path: string, options?: { ignoreUnsaved?: boolean }) => void;
  roomId?: string; // If editing existing room
}

export const CreatePrayerRoomPage: React.FC<CreatePrayerRoomPageProps> = ({
  onNavigate,
  roomId,
}) => {
  const { prayerRooms, createPrayerRoom, updatePrayerRoom, addToast, setHasUnsavedChanges } = useApp();
  const { organization } = useAuth();

  const existing = roomId ? prayerRooms.find((r) => r.id === roomId) : null;

  const [name, setName] = useState(existing?.name || '');
  const [slug, setSlug] = useState(existing?.slug || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [logoUrl, setLogoUrl] = useState(existing?.logoUrl || '');
  const [expectedAttendance, setExpectedAttendance] = useState<number>(existing?.expectedAttendance || 1000);
  const [roomType, setRoomType] = useState<'AUDIO_PRAYER' | 'PRAYER_LEADER_VIDEO' | 'EVENT'>(
    existing?.roomType || 'AUDIO_PRAYER'
  );
  const [isRecurring, setIsRecurring] = useState(existing ? existing.isRecurring : true);
  const [recurrenceRule, setRecurrenceRule] = useState<'DAILY' | 'WEEKLY' | 'SELECTED_DAYS'>(
    existing?.recurrenceRule || 'DAILY'
  );
  const [scheduledStart, setScheduledStart] = useState(existing?.scheduledStart || '05:00 AM');
  const [timezone, setTimezone] = useState(existing?.timezone || organization.timezone || 'Africa/Kampala');
  const [speakerPermission, setSpeakerPermission] = useState(
    existing?.speakerPermission || 'ADMIN_APPROVAL_REQUIRED'
  );
  const [recordingEnabled, setRecordingEnabled] = useState(existing?.recordingEnabled || false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateSlugWarning, setDuplicateSlugWarning] = useState<{
    inUse: boolean;
    suggestedAlternative: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { startTour } = useTour(TOUR_IDS.createRoom, createRoomTourSteps, {
    delayMs: 700,
    enabled: isPastorJourneyComplete() && !roomId,
  });

  // Form dirty state detection
  const isDirty = useMemo(() => {
    if (existing) {
      return (
        name !== existing.name ||
        slug !== existing.slug ||
        description !== (existing.description || '') ||
        logoUrl !== (existing.logoUrl || '') ||
        expectedAttendance !== existing.expectedAttendance ||
        scheduledStart !== existing.scheduledStart ||
        isRecurring !== existing.isRecurring
      );
    }
    return Boolean(name.trim() || slug.trim() || description.trim() || logoUrl.trim());
  }, [name, slug, description, logoUrl, expectedAttendance, scheduledStart, isRecurring, existing]);

  useUnsavedChanges(isDirty);

  const backTo = existing ? `/dashboard/prayer-rooms/${existing.id}` : '/dashboard/prayer-rooms';
  const backLabel = existing ? 'Back to Prayer Room' : 'Back to Prayer Rooms';

  const handleNameChange = (val: string) => {
    setName(val);
    if (!existing) {
      const generatedSlug = slugify(val);
      setSlug(generatedSlug);
      checkSlugDuplicate(generatedSlug);
    }
  };

  const handleSlugChange = (val: string) => {
    const cleanSlug = slugify(val);
    setSlug(cleanSlug);
    checkSlugDuplicate(cleanSlug);
  };

  const checkSlugDuplicate = (targetSlug: string) => {
    const normalized = targetSlug.toLowerCase().trim();
    if (!normalized) {
      setDuplicateSlugWarning(null);
      return;
    }

    const otherRooms = prayerRooms.filter((r) => (!existing ? true : r.id !== existing.id));
    const isTaken = otherRooms.some((r) => r.slug.toLowerCase().trim() === normalized);

    if (isTaken) {
      const allSlugs = prayerRooms.map((r) => r.slug);
      const alternative = suggestAlternativeSlug(normalized, allSlugs);
      setDuplicateSlugWarning({
        inUse: true,
        suggestedAlternative: alternative,
      });
    } else {
      setDuplicateSlugWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const normalizedSlug = slugify(slug || name);

    // Duplicate Check
    const otherRooms = prayerRooms.filter((r) => (!existing ? true : r.id !== existing.id));
    const isTaken = otherRooms.some((r) => r.slug.toLowerCase().trim() === normalizedSlug);

    if (isTaken) {
      const allSlugs = prayerRooms.map((r) => r.slug);
      const alternative = suggestAlternativeSlug(normalizedSlug, allSlugs);
      setDuplicateSlugWarning({
        inUse: true,
        suggestedAlternative: alternative,
      });
      addToast('This Permanent Altar Link is already in use.', 'error');
      return;
    }

    if (logoUrl.trim() && !isHttpUrl(logoUrl.trim())) {
      setErrors({ logoUrl: 'Logo must be a public http or https image URL.' });
      addToast('Please review the form errors', 'warning');
      return;
    }

    const formData = {
      organizationId: organization.id,
      name: name.trim(),
      slug: normalizedSlug,
      description: description.trim(),
      logoUrl: logoUrl.trim() || undefined,
      expectedAttendance: Number(expectedAttendance),
      roomType,
      isRecurring,
      recurrenceRule,
      scheduledStart,
      timezone,
      speakerPermission,
      recordingEnabled,
      permanentUrl: `/join/${normalizedSlug}`,
      status: (existing?.status || 'SCHEDULED') as any,
    };

    const validationResult = createPrayerRoomSchema.safeParse(formData);
    if (!validationResult.success) {
      const errMap: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        if (err.path[0]) errMap[err.path[0] as string] = err.message;
      });
      setErrors(errMap);
      addToast('Please review the form errors', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (existing) {
        await updatePrayerRoom(existing.id, formData);
        setHasUnsavedChanges(false);
        onNavigate(`/dashboard/prayer-rooms/${existing.id}`, { ignoreUnsaved: true });
      } else {
        const created = await createPrayerRoom(formData);
        setHasUnsavedChanges(false);
        onNavigate(`/dashboard/prayer-rooms/${created.id}`, { ignoreUnsaved: true });
      }
    } catch {
      /* create/update already surfaces the error */
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = existing
    ? [
        { label: 'Prayer Rooms', path: '/dashboard/prayer-rooms' },
        { label: existing.name, path: `/dashboard/prayer-rooms/${existing.id}` },
        { label: 'Edit', isCurrent: true },
      ]
    : [
        { label: 'Prayer Rooms', path: '/dashboard/prayer-rooms' },
        { label: 'Create Prayer Room', isCurrent: true },
      ];

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-12">
      {/* Top Breadcrumb and Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <BackButton
            to={backTo}
            label={backLabel}
            mobileLabel="Back"
            onNavigate={onNavigate}
            isDirty={isDirty}
          />
          <Breadcrumbs items={breadcrumbs} onNavigate={onNavigate} />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => startTour()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] text-xs font-semibold text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            aria-label="Show create room tutorial"
          >
            <CircleHelp className="w-3.5 h-3.5" />
            <span>Help</span>
          </button>
          <span className="text-xs font-bold text-[#C9A35A] uppercase tracking-wider hidden sm:block">
            {existing ? 'Edit Altar' : 'New Altar Setup'}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#17221D] rounded-3xl p-6 sm:p-10 border border-[#E5E6E1] dark:border-[#26362F] shadow-xs">
        <div className="mb-6 pb-6 border-b border-[#E5E6E1] dark:border-[#26362F]">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16251F] dark:text-[#F8F7F3] tracking-tight">
            {existing ? `Edit: ${existing.name}` : 'Create Prayer Room'}
          </h1>
          <p className="text-xs sm:text-sm text-[#68736D] dark:text-[#96A39D] mt-1">
            Configure gathering settings, permanent altar link, and speaker permission rules.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Altar Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#203C32] dark:text-[#C9A35A] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              <span>Room Details</span>
            </h3>

            <div data-tour="create-room-name">
              <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1.5">
                Prayer Room Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Dawn Intercession, Morning Prayer, Midday Intercession"
                className="w-full px-4 py-3 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#203C32] dark:focus:ring-[#C9A35A]"
              />
              {errors.name && <p className="text-xs text-[#B94A48] mt-1">{errors.name}</p>}
            </div>

            <div data-tour="create-room-logo">
              <LogoUrlField
                value={logoUrl}
                onChange={setLogoUrl}
                label="Room logo URL"
                hint="Optional. Shows on this room’s join page. Leave blank to use your church logo."
                previewAlt="Room logo preview"
              />
              {errors.logoUrl && <p className="text-xs text-[#B94A48] mt-1">{errors.logoUrl}</p>}
            </div>

            <div data-tour="create-room-slug">
              <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1.5">
                Permanent Altar Link Slug *
              </label>
              <div className="flex items-center px-4 py-3 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-xs font-mono text-[#68736D] dark:text-[#96A39D]">
                <span>{window.location.origin}/join/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="flex-1 bg-transparent text-[#16251F] dark:text-[#F8F7F3] font-bold focus:outline-none ml-1"
                />
              </div>
              {errors.slug && <p className="text-xs text-[#B94A48] mt-1">{errors.slug}</p>}

              {/* Duplicate Slug Warning Box */}
              {duplicateSlugWarning?.inUse && (
                <div className="mt-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="block font-bold text-amber-950 dark:text-amber-100">
                      This Permanent Altar Link is already in use.
                    </strong>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      Choose another link or change the prayer room name.
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-[11px] font-medium">Suggested alternative:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSlug(duplicateSlugWarning.suggestedAlternative);
                          setDuplicateSlugWarning(null);
                        }}
                        className="px-2 py-0.5 rounded-md font-mono font-bold bg-amber-200 dark:bg-amber-800/60 text-amber-900 dark:text-amber-100 hover:underline cursor-pointer"
                      >
                        {duplicateSlugWarning.suggestedAlternative}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1.5">
                Description / Prayer Focus
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="e.g. A sacred gathering dedicated to morning intercession, personal repentance, and revival declaration."
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Attendance & Media Mode */}
          <div className="pt-4 border-t border-[#E5E6E1] dark:border-[#26362F] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#203C32] dark:text-[#C9A35A] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Attendance & Format</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1.5">
                  Expected Attendance
                </label>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={expectedAttendance}
                  onChange={(e) => setExpectedAttendance(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1.5">
                  Room Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRoomType('AUDIO_PRAYER')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold cursor-pointer ${
                      roomType === 'AUDIO_PRAYER'
                        ? 'border-[#203C32] dark:border-[#C9A35A] bg-[#203C32]/5 dark:bg-[#C9A35A]/10 text-[#203C32] dark:text-[#E8D8B2]'
                        : 'border-[#E5E6E1] dark:border-[#26362F] text-[#68736D]'
                    }`}
                  >
                    Audio Prayer
                  </button>
                  <button
                    type="button"
                    disabled
                    className="p-2.5 rounded-xl border text-left text-xs font-semibold border-[#E5E6E1] dark:border-[#26362F] text-[#68736D] opacity-70 cursor-not-allowed"
                  >
                    Leader Video
                    <span className="block text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-300 mt-1">
                      Coming Soon
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Schedule & Frequency */}
          <div className="pt-4 border-t border-[#E5E6E1] dark:border-[#26362F] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#203C32] dark:text-[#C9A35A] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Schedule & Recurrence</span>
            </h3>

            <div className="flex items-center gap-3">
              <input
                id="isRecurring"
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 accent-[#203C32] dark:accent-[#C9A35A] rounded cursor-pointer"
              />
              <label htmlFor="isRecurring" className="text-xs font-semibold text-[#16251F] dark:text-[#F8F7F3] cursor-pointer">
                Recurring Prayer Gathering (Runs automatically on set schedule)
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={(() => {
                    const clock = parseClockTime(scheduledStart);
                    return `${String(clock.hours).padStart(2, '0')}:${String(clock.minutes).padStart(2, '0')}`;
                  })()}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    setScheduledStart(formatClockTime(hours || 0, minutes || 0));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1">
                  Frequency
                </label>
                <select
                  value={recurrenceRule}
                  onChange={(e) => setRecurrenceRule(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-xs"
                >
                  <option value="DAILY">Daily (Every Day)</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="SELECTED_DAYS">Selected Days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1">
                  Timezone
                </label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Speaker Permissions & Recording */}
          <div className="pt-4 border-t border-[#E5E6E1] dark:border-[#26362F] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#203C32] dark:text-[#C9A35A] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Moderation & Permissions</span>
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1.5">
                Speaker Permission Rule
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] cursor-pointer">
                  <input
                    type="radio"
                    name="permissionMode"
                    value="ADMIN_APPROVAL_REQUIRED"
                    checked={speakerPermission === 'ADMIN_APPROVAL_REQUIRED'}
                    onChange={() => setSpeakerPermission('ADMIN_APPROVAL_REQUIRED')}
                    className="mt-0.5 accent-[#203C32] dark:accent-[#C9A35A]"
                  />
                  <div>
                    <strong className="block text-xs text-[#16251F] dark:text-[#F8F7F3]">
                      Admin / Pastor Approval Required (Strict Sanctum Standard)
                    </strong>
                    <span className="text-[11px] text-[#68736D] dark:text-[#96A39D]">
                      During the gathering, admins can mute everyone except the pastor, apostle, and ministers for opening prayer, then unmute the room for discussion.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] cursor-pointer">
                  <input
                    type="radio"
                    name="permissionMode"
                    value="PRAYER_LEADERS"
                    checked={speakerPermission === 'PRAYER_LEADERS'}
                    onChange={() => setSpeakerPermission('PRAYER_LEADERS')}
                    className="mt-0.5 accent-[#203C32] dark:accent-[#C9A35A]"
                  />
                  <div>
                    <strong className="block text-xs text-[#16251F] dark:text-[#F8F7F3]">
                      Designated Prayer Leaders Only
                    </strong>
                    <span className="text-[11px] text-[#68736D] dark:text-[#96A39D]">
                      Only team members with Prayer Leader status can speak. Hand raising is disabled for attendees.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                id="recording"
                type="checkbox"
                checked={recordingEnabled}
                onChange={(e) => setRecordingEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#203C32] dark:accent-[#C9A35A] rounded cursor-pointer"
              />
              <div>
                <label htmlFor="recording" className="text-xs font-semibold text-[#16251F] dark:text-[#F8F7F3] cursor-pointer block">
                  Archive session audio for ministry records
                </label>
                <span className="text-[10px] text-[#68736D] dark:text-[#96A39D]">
                  Default is Off to maintain congregation peace and privacy.
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-[#E5E6E1] dark:border-[#26362F] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate(backTo)}
              className="px-5 py-2.5 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] text-xs font-semibold text-[#68736D] dark:text-[#96A39D] hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || Boolean(duplicateSlugWarning?.inUse)}
              data-tour="create-room-save"
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : existing ? 'Save Changes' : 'Create Prayer Room'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
