import React, { useCallback, useEffect, useState } from 'react';
import { Mail, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { ApiClientError, sanctumApi } from '../../services/api/sanctumApi';
import { INVITEABLE_ORG_ROLES } from '../../../shared/roles.ts';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  PRAYER_LEADER: 'Prayer Leader',
  TECHNICAL_ADMIN: 'Technical Admin',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INVITED: 'Invited',
  SUSPENDED: 'Suspended',
};

type TeamMember = { userId: string; name: string; email: string; role: string; status: string };

export const TeamInvitePanel: React.FC = () => {
  const { user, organization } = useAuth();
  const { addToast } = useApp();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<(typeof INVITEABLE_ORG_ROLES)[number]>('ADMIN');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const actor = { userId: user?.id, organizationId: organization.id };

  const loadMembers = useCallback(async () => {
    try {
      const result = await sanctumApi.listTeam({ userId: user?.id, organizationId: organization.id });
      setMembers(result.members);
    } catch (error) {
      addToast(error instanceof ApiClientError ? error.message : 'Could not load the church team.', 'error');
    } finally {
      setLoading(false);
    }
  }, [organization.id, user?.id, addToast]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      addToast('Enter a valid staff email.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const result = await sanctumApi.inviteTeamMember({ email: trimmed, role }, actor);
      setEmail('');
      addToast(
        result.clerkInviteSent
          ? `Invite sent to ${result.member.email}. They can Sign in with that email.`
          : `${result.member.email} is invited. Ask them to Sign in with that email.`,
        'success'
      );
      await loadMembers();
    } catch (error) {
      addToast(error instanceof ApiClientError ? error.message : 'Could not invite that staff member.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#17221D] rounded-3xl p-6 sm:p-8 border border-[#E5E6E1] dark:border-[#26362F] space-y-6">
      <div>
        <h3 className="text-base font-bold text-[#16251F] dark:text-[#F8F7F3]">Church team</h3>
        <p className="text-xs text-[#68736D] dark:text-[#96A39D] mt-1 leading-relaxed">
          Congregation never signs in. Add pastors and admins by email. They Sign in with that same address — no public
          Sign up onto the dashboard.
        </p>
      </div>

      <form onSubmit={handleInvite} className="space-y-3">
        <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3]">
          Invite staff by email
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="pastor@yourchurch.org"
            className="flex-1 px-4 py-3 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-sm font-semibold"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as (typeof INVITEABLE_ORG_ROLES)[number])}
            className="px-4 py-3 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-sm font-semibold"
          >
            {INVITEABLE_ORG_ROLES.map((option) => (
              <option key={option} value={option}>
                {ROLE_LABELS[option]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-3 rounded-xl font-bold text-xs bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <UserPlus className="w-4 h-4" />
            <span>{submitting ? 'Inviting…' : 'Invite'}</span>
          </button>
        </div>
        <p className="text-[11px] text-[#68736D] dark:text-[#96A39D]">
          Tell them to open Sign in and use this email. Owner cannot be invited this way.
        </p>
      </form>

      <div className="pt-4 border-t border-[#E5E6E1] dark:border-[#26362F] space-y-2">
        {loading ? (
          <p className="text-xs text-[#68736D] dark:text-[#96A39D]">Loading team…</p>
        ) : members.length === 0 ? (
          <p className="text-xs text-[#68736D] dark:text-[#96A39D]">No team members yet.</p>
        ) : (
          members.map((member) => (
            <div
              key={member.userId}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-3 rounded-2xl bg-[#F8F7F3] dark:bg-[#101814] border border-[#E5E6E1] dark:border-[#26362F]"
            >
              <div>
                <p className="text-sm font-semibold text-[#16251F] dark:text-[#F8F7F3]">{member.name}</p>
                <p className="text-[11px] text-[#68736D] dark:text-[#96A39D] flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {member.email}
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
                <span className="text-[#203C32] dark:text-[#C9A35A]">{ROLE_LABELS[member.role] || member.role}</span>
                <span
                  className={
                    member.status === 'ACTIVE'
                      ? 'text-[#3D6655] dark:text-[#96A39D]'
                      : 'text-amber-800 dark:text-amber-200'
                  }
                >
                  {STATUS_LABELS[member.status] || member.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
