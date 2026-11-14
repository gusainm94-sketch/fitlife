const AVATAR_STYLES = new Set(['male', 'female', 'neutral'])

export default function ProfileAvatar({ avatar = '', size = 34, className = '' }) {
  const style = AVATAR_STYLES.has(avatar) ? avatar : 'neutral'
  const hair = style === 'female'
    ? <path d="M11 22c-2-9 2-17 13-17s15 8 13 17v12c-2 7-6 10-13 10s-11-3-13-10V22Z" fill="var(--avatar-hair)" />
    : style === 'male'
      ? <path d="M12 22c-1-10 4-16 12-16s13 6 12 16l-4-3c-5 1-10 0-15-2l-5 5Z" fill="var(--avatar-hair)" />
      : <path d="M11 22c0-10 5-15 13-15s13 5 13 15c-3-3-7-5-13-5s-10 2-13 5Z" fill="var(--avatar-hair)" />

  return (
    <span className={`profile-avatar profile-avatar-${style}${className ? ` ${className}` : ''}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        {hair}
        <path d="M16 34h16l8 9H8l8-9Z" fill="var(--avatar-shirt)" />
        <path d="M20 30h8v8h-8z" fill="var(--avatar-skin)" />
        <circle cx="24" cy="21" r="10" fill="var(--avatar-skin)" />
        {style === 'female' && <path d="M14 19c1-8 5-12 10-12s9 4 10 12c-4-3-7-4-10-4s-6 1-10 4Z" fill="var(--avatar-hair)" />}
        <circle cx="20.5" cy="22" r="0.8" fill="var(--avatar-detail)" />
        <circle cx="27.5" cy="22" r="0.8" fill="var(--avatar-detail)" />
        <path d="M21 26c1.7 1.4 4.3 1.4 6 0" fill="none" stroke="var(--avatar-detail)" strokeLinecap="round" strokeWidth="1.2" />
      </svg>
    </span>
  )
}
