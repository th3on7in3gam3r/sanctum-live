import React, { useState } from 'react';
import { SanctumLogo } from '../components/common/SanctumLogo';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Building,
  Calendar,
  Radio,
  Share2,
  Sun,
  Moon,
} from 'lucide-react';
import { slugify } from '../lib/utils';

interface OnboardingPageProps {
  onNavigate: (path: string) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onNavigate }) => {
  const { updateOrganization, organization } = useAuth();
  const { createPrayerRoom, isDarkMode, toggleDarkMode, addToast } = useApp();

  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);

  // Step 1 State
  const [churchName, setChurchName] = useState('Miracle Center Kampala');
  const [churchSlug, setChurchSlug] = useState('miracle-center-kampala');

  // Step 2 State
  const [country, setCountry] = useState('Uganda');
  const [timezone, setTimezone] = useState('Africa/Kampala');
  const [website, setWebsite] = useState('https://miraclecenter.org');
  const [contactName, setContactName] = useState('Pastor Kenneth');
  const [contactEmail, setContactEmail] = useState('kenneth@miraclecenter.org');
  const [contactPhone, setContactPhone] = useState('+256 700 123456');

  // Step 3 State (Schedule)
  const [schedulePattern, setSchedulePattern] = useState<'DAILY' | 'WEEKLY' | 'SPECIFIC_DAYS' | 'NONE'>('DAILY');
  const [scheduledTime, setScheduledTime] = useState('05:00');

  // Step 4 State (First Prayer Room)
  const [roomName, setRoomName] = useState('Dawn Intercession');
  const [roomDescription, setRoomDescription] = useState('Daily morning prayer, intercession and prophetic declaration.');
  const [expectedAttendance, setExpectedAttendance] = useState<number>(2000);
  const [roomType, setRoomType] = useState<'AUDIO_PRAYER' | 'LEADER_VIDEO'>('AUDIO_PRAYER');
  const [speakerPermissionMode, setSpeakerPermissionMode] = useState<'ADMIN_APPROVAL_REQUIRED' | 'PRAYER_LEADERS_ONLY'>('ADMIN_APPROVAL_REQUIRED');

  const handleNext = () => {
    if (step === 1 && !churchName.trim()) {
      addToast('Please enter your church name', 'warning');
      return;
    }
    if (step === 4) {
      // Save all information
      updateOrganization({
        name: churchName,
        slug: churchSlug || slugify(churchName),
        country,
        timezone,
        website,
      });

      createPrayerRoom({
        name: roomName,
        slug: slugify(roomName),
        description: roomDescription,
        expectedAttendance: Number(expectedAttendance) || 1000,
        roomType,
        isRecurring: schedulePattern === 'DAILY',
        recurrenceRule: schedulePattern === 'DAILY' ? 'Daily' : 'Weekly',
        scheduledStart: scheduledTime,
        timezone,
        speakerPermissionMode,
        isPermanentLinkEnabled: true,
        recordingEnabled: false,
      });

      addToast('Prayer room created and church registered!', 'success');
    }
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const fullJoinUrl = `https://sanctum.live/join/${slugify(roomName || 'morning-prayer')}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullJoinUrl);
    setCopied(true);
    addToast('Prayer link copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Join us in prayer for ${roomName} at ${churchName}! Tap the link to pray: ${fullJoinUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] dark:bg-[#101814] flex flex-col justify-between p-4 sm:p-6 transition-colors">
      {/* Top Header */}
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between pt-2 pb-6">
        <SanctumLogo size="md" showTagline />
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#68736D] dark:text-[#96A39D]">
            Step {step} of 5
          </span>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-[#C9A35A]" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-2xl w-full mx-auto mb-6 bg-[#E5E6E1] dark:bg-[#26362F] h-1.5 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#203C32] dark:bg-[#C9A35A] transition-all duration-300"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      {/* Main Card */}
      <main className="max-w-2xl w-full mx-auto my-auto bg-white dark:bg-[#17221D] rounded-3xl p-6 sm:p-10 shadow-xl border border-[#E5E6E1] dark:border-[#26362F]">
        {/* Step 1: Welcome & Church Name */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#203C32]/10 dark:bg-[#C9A35A]/15 text-[#203C32] dark:text-[#C9A35A] flex items-center justify-center mx-auto mb-2">
                <Building className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#16251F] dark:text-[#F8F7F3] tracking-tight">
                Welcome to Sanctum Live™
              </h2>
              <p className="text-xs sm:text-sm text-[#68736D] dark:text-[#96A39D]">
                Let's set up your church's dedicated prayer sanctuary.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#16251F] dark:text-[#F8F7F3] mb-1.5">
                  Church / Ministry Name
                </label>
                <input
                  type="text"
                  required
                  value={churchName}
                  onChange={(e) => {
                    setChurchName(e.target.value);
                    setChurchSlug(slugify(e.target.value));
                  }}
                  placeholder="e.g. Miracle Center Kampala"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-[#16251F] dark:text-[#F8F7F3] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#16251F] dark:text-[#F8F7F3] mb-1.5">
                  Custom Prayer Link Slug
                </label>
                <div className="flex items-center px-4 py-3 rounded-2xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-xs font-mono text-[#68736D] dark:text-[#96A39D]">
                  <span>sanctum.live/</span>
                  <input
                    type="text"
                    value={churchSlug}
                    onChange={(e) => setChurchSlug(slugify(e.target.value))}
                    className="flex-1 bg-transparent text-[#16251F] dark:text-[#F8F7F3] font-bold focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Church Details */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-extrabold text-[#16251F] dark:text-[#F8F7F3]">
                Church Location & Contact
              </h2>
              <p className="text-xs text-[#68736D] dark:text-[#96A39D]">
                Used for localized prayer reminders and lead pastor notifications.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-sm"
                >
                  <option value="Africa/Kampala">Africa/Kampala (EAT, UTC+3)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (EAT, UTC+3)</option>
                  <option value="Africa/Lagos">Africa/Lagos (WAT, UTC+1)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1">
                  Primary Contact Name
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Prayer Schedule */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-[#203C32]/10 dark:bg-[#C9A35A]/15 text-[#203C32] dark:text-[#C9A35A] flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#16251F] dark:text-[#F8F7F3]">
                When does your church gather to pray?
              </h2>
              <p className="text-xs text-[#68736D] dark:text-[#96A39D]">
                Select your regular intercession rhythm. You can always change or add more rooms.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'DAILY', title: 'Daily Prayer', desc: 'Every morning or evening' },
                { id: 'WEEKLY', title: 'Weekly Prayer', desc: 'Midweek / Friday prayer' },
                { id: 'SPECIFIC_DAYS', title: 'Specific Days', desc: 'Mon, Wed, Fri' },
                { id: 'NONE', title: 'Special Events Only', desc: 'As scheduled' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSchedulePattern(item.id as any)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    schedulePattern === item.id
                      ? 'border-[#203C32] dark:border-[#C9A35A] bg-[#203C32]/5 dark:bg-[#C9A35A]/10'
                      : 'border-[#E5E6E1] dark:border-[#26362F] hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-bold text-sm text-[#16251F] dark:text-[#F8F7F3]">{item.title}</h4>
                  <p className="text-xs text-[#68736D] dark:text-[#96A39D] mt-1">{item.desc}</p>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1.5">
                Default Gathering Time
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-base font-bold"
              />
            </div>
          </div>
        )}

        {/* Step 4: First Prayer Room */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-[#203C32]/10 dark:bg-[#C9A35A]/15 text-[#203C32] dark:text-[#C9A35A] flex items-center justify-center mx-auto mb-2">
                <Radio className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#16251F] dark:text-[#F8F7F3]">
                Create Your First Prayer Room
              </h2>
              <p className="text-xs text-[#68736D] dark:text-[#96A39D]">
                This creates your permanent altar link for congregation members.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1">
                  Prayer Gathering Name
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Dawn Intercession"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1">
                  Expected Attendance
                </label>
                <input
                  type="number"
                  value={expectedAttendance}
                  onChange={(e) => setExpectedAttendance(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1">
                  Room Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRoomType('AUDIO_PRAYER')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold ${
                      roomType === 'AUDIO_PRAYER'
                        ? 'border-[#203C32] dark:border-[#C9A35A] bg-[#203C32]/5 dark:bg-[#C9A35A]/10 font-bold'
                        : 'border-[#E5E6E1] dark:border-[#26362F]'
                    }`}
                  >
                    Audio Prayer (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomType('LEADER_VIDEO')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold ${
                      roomType === 'LEADER_VIDEO'
                        ? 'border-[#203C32] dark:border-[#C9A35A] bg-[#203C32]/5 dark:bg-[#C9A35A]/10 font-bold'
                        : 'border-[#E5E6E1] dark:border-[#26362F]'
                    }`}
                  >
                    Prayer Leader Video
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Ready / Share Altar Link */}
        {step === 5 && (
          <div className="space-y-6 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#16251F] dark:text-[#F8F7F3] tracking-tight">
                Your Prayer Sanctuary is Ready!
              </h2>
              <p className="text-sm text-[#68736D] dark:text-[#96A39D] mt-1">
                Your permanent prayer link is active. Share it with your congregation now.
              </p>
            </div>

            {/* Permanent Link Card */}
            <div className="p-5 rounded-2xl bg-[#F8F7F3] dark:bg-[#101814] border-2 border-[#C9A35A] text-left space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9A35A]">
                Permanent Altar Link:
              </span>
              <p className="text-sm font-mono font-bold text-[#16251F] dark:text-[#F8F7F3] break-all">
                {fullJoinUrl}
              </p>
            </div>

            {/* Share & Copy Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleCopyLink}
                type="button"
                className="py-3.5 px-4 rounded-xl font-bold text-sm border-2 border-[#203C32] dark:border-[#C9A35A] text-[#203C32] dark:text-[#E8D8B2] hover:bg-[#203C32]/5 flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Link Copied' : 'Copy Prayer Link'}</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                type="button"
                className="py-3.5 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share to WhatsApp</span>
              </button>
            </div>

            <button
              onClick={() => onNavigate('/dashboard')}
              type="button"
              className="w-full py-4 px-6 rounded-2xl font-bold text-base bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] shadow-xl flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span>Enter Admin Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step Navigation Buttons (Steps 1-4) */}
        {step < 5 && (
          <div className="mt-8 pt-6 border-t border-[#E5E6E1] dark:border-[#26362F] flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((p) => p - 1)}
                className="px-4 py-2.5 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] text-xs font-semibold text-[#68736D] dark:text-[#96A39D] flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span>{step === 4 ? 'Complete Setup' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
