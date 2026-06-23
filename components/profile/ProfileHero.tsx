'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import {
  FaCheckCircle, FaStar, FaShieldAlt, FaCamera,
  FaMapMarkerAlt, FaUser, FaSpinner, FaLock,
} from 'react-icons/fa'

/**
 * Facebook/LinkedIn-style hero for the unified profile page. Cover banner
 * on top, avatar overlapping at the bottom-left, name + role badge +
 * verified checkmark, quick stats row, and a primary CTA (Edit or Contact
 * depending on `isSelf`).
 *
 * The cover photo is optional - falls back to a teal brand gradient that
 * uses the design tokens from `.claude/rules/flutter-design-tokens.md` so
 * web  Flutter stay visually aligned.
 */
export interface ProfileHeroProps {
  userId: string
  firstName: string
  lastName: string
  profileImage?: string | null
  coverImage?: string | null
  userType: string
  roleLabel?: string         // e.g. "Cardiologist" or "Member"
  verified?: boolean
  rating?: number | null     // provider rating, 0..5
  location?: string | null
  bio?: string | null
  stats?: Array<{ label: string; value: string | number }>
  isSelf: boolean
  onContact?: () => void
  onCoverUpload?: (file: File) => void
  onAvatarUpload?: (file: File) => void
}

export default function ProfileHero(props: ProfileHeroProps) {
  const {
    firstName, lastName, profileImage, coverImage,
    roleLabel, verified, rating, location, bio, stats = [],
    isSelf, onContact, onCoverUpload, onAvatarUpload,
  } = props
  const fullName = `${firstName} ${lastName}`.trim() || 'Unnamed'

  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [coverError, setCoverError] = useState('')
  const coverInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleCoverChange = async (file: File) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setCoverError('File too large (max 10MB)'); return }
    if (!file.type.startsWith('image/')) { setCoverError('Only image files allowed'); return }
    setUploadingCover(true)
    setCoverError('')
    try {
      await onCoverUpload?.(file)
    } catch {
      setCoverError('Upload failed - try again')
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const handleAvatarChange = async (file: File) => {
    if (!file) return
    setUploadingAvatar(true)
    try {
      await onAvatarUpload?.(file)
    } catch {
      // parent shows alert
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  return (
    <header className="bg-surface rounded-b-2xl sm:rounded-2xl shadow-sm overflow-hidden border border-line">
      {/*  Cover  */}
      <div className="relative h-40 sm:h-56 md:h-64 bg-gradient-to-br from-[#001E40] via-[#0C6780] to-[#9AE1FF]">
        {coverImage && (
          <Image
            src={coverImage}
            alt="Cover"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        )}
        {isSelf && (
          <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/90 hover:bg-surface text-fg px-3 py-1.5 rounded-lg cursor-pointer shadow disabled:opacity-70"
            >
              {uploadingCover ? <FaSpinner className="animate-spin text-[10px]" /> : <FaCamera className="text-[10px]" />}
              {uploadingCover ? 'Uploading' : 'Change cover'}
            </button>
            {coverError && (
              <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-lg">{coverError}</span>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverChange(f) }}
            />
          </div>
        )}
      </div>

      {/*  Avatar + meta row  */}
      <div className="px-4 sm:px-6 pb-5 -mt-14 sm:-mt-16">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="relative">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-surface bg-subtle overflow-hidden shadow">
              {profileImage ? (
                <Image src={profileImage} alt={fullName} width={128} height={128} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-faint">
                  <FaUser className="text-4xl" />
                </div>
              )}
            </div>
            {isSelf && (
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 bg-[#0C6780] hover:bg-[#001E40] text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg cursor-pointer disabled:opacity-70"
              >
                {uploadingAvatar ? <FaSpinner className="animate-spin text-xs" /> : <FaCamera className="text-xs" />}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarChange(f) }}
                />
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0 sm:pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-fg truncate">{fullName}</h1>
              {verified && (
                <span title="Verified account" className="text-[#0C6780] dark:text-accent">
                  <FaCheckCircle className="text-lg" />
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {roleLabel && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#0C6780]/10 text-[#0C6780] dark:text-accent border border-[#0C6780]/20 dark:border-accent/30">
                  {roleLabel}
                </span>
              )}
              {typeof rating === 'number' && rating > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                  <FaStar className="text-amber-500 text-[10px]" />
                  {rating.toFixed(1)}
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1 text-xs text-soft">
                  <FaMapMarkerAlt className="text-faint text-[10px]" /> {location}
                </span>
              )}
            </div>
            {bio && (
              <p className="mt-2 text-sm text-soft line-clamp-2 max-w-2xl">{bio}</p>
            )}
          </div>

          {!isSelf && (
            <div className="sm:pb-2">
              <button
                onClick={onContact}
                className="inline-flex items-center gap-1.5 text-sm font-semibold bg-[#0C6780] hover:bg-[#001E40] text-white px-4 py-2 rounded-lg shadow-sm"
              >
                Message
              </button>
            </div>
          )}
        </div>

        {/*  Stats row (Posts / Followers / Years etc.)  */}
        {stats.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-sm">
            {stats.map((s) => (
              <li key={s.label} className="flex items-baseline gap-1.5">
                <span className="font-bold text-fg text-base">{s.value}</span>
                <span className="text-soft">{s.label}</span>
              </li>
            ))}
          </ul>
        )}

        {/*  Privacy legend  */}
        {isSelf && (
          <div className="mt-4 text-[11px] text-soft flex items-center gap-2">
            <FaShieldAlt className="text-faint" />
            <span>Sections marked <span className="inline-flex items-center gap-1 bg-subtle text-soft px-1.5 py-0.5 rounded font-medium"><FaLock className="text-[9px]" /> Private</span> are visible only to you and MediWyz admins.</span>
          </div>
        )}
      </div>
    </header>
  )
}
