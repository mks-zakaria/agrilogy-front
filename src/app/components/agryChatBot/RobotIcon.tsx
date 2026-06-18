/**
 * Brand assistant glyph — a friendly, modern line-style robot used wherever the
 * assistant appears (nav item, slide-out tab + header). Inherits `currentColor`
 * and scales with `size`, so it drops into both the react-icons nav slots and
 * the Chakra buttons. Replaces the generic chat-bubble icon.
 */
export const RobotIcon = ({
  size = 22,
  ...rest
}: {
  size?: number;
  'aria-hidden'?: boolean;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {/* antenna */}
    <path d="M12 3.5V6.5" />
    <circle cx="12" cy="2.4" r="1.1" fill="currentColor" stroke="none" />
    {/* head */}
    <rect x="3.75" y="6.5" width="16.5" height="12" rx="4" />
    {/* side ears */}
    <path d="M2 11v3M22 11v3" />
    {/* eyes */}
    <circle cx="9" cy="11.6" r="1.35" fill="currentColor" stroke="none" />
    <circle cx="15" cy="11.6" r="1.35" fill="currentColor" stroke="none" />
    {/* smile */}
    <path d="M9 14.8c.9.9 4.1.9 6 0" />
  </svg>
);
