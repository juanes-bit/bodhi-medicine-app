type VimeoPlayerProps = {
  id: string | number;
  h?: string;
  title?: string;
};

export default function VimeoPlayer({ id, h, title }: VimeoPlayerProps) {
  const qs = new URLSearchParams({
    ...(h ? { h } : {}),
    title: '0',
    byline: '0',
    portrait: '0',
    dnt: '1',
    transparent: '0',
  });

  const src = `https://player.vimeo.com/video/${id}?${qs.toString()}`;

  return (
    <div style={{ position: 'relative', paddingTop: '56.25%' }}>
      <iframe
        src={src}
        title={title ?? `Vimeo ${id}`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
      />
    </div>
  );
}
