const paths = {
  folder: (
    <>
      <path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M3 9h18" />
    </>
  ),
  export: (
    <>
      <path d="M12 15V3m-4 4 4-4 4 4M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
    </>
  ),
  play: <path d="m8 4 12 8-12 8Z" />,
  pause: (
    <>
      <path d="M8 4v16M16 4v16" />
    </>
  ),
  back: (
    <>
      <path d="M5 5v14m14-14L8 12l11 7Z" />
    </>
  ),
  next: (
    <>
      <path d="M19 5v14M5 5l11 7-11 7Z" />
    </>
  ),
  pin: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="M12 15v6m-2-12h4m-2-2v4" />
    </>
  ),
  edit: (
    <>
      <path d="m14 5 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  undo: (
    <>
      <path d="M8 4 3 9l5 5M3 9h11a7 7 0 0 1 0 14" />
    </>
  ),
  sound: (
    <>
      <path d="m11 4-6 5H2v6h3l6 5Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
    </>
  ),
  mute: (
    <>
      <path d="m11 4-6 5H2v6h3l6 5Zm5 5 6 6m-6 0 6-6" />
    </>
  ),
};
export default function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
