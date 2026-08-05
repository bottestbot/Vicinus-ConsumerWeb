import { extractListingVideo, isPhotoMedia } from './ddf-media.util';

/** Build a DDF Media row. Category defaults to the video-tour catch-all. */
const media = (url: string, MediaCategory = 'Video Tour Website') => ({
  MediaURL: url,
  MediaCategory,
});

describe('extractListingVideo', () => {
  // URL shapes below are taken verbatim from the live BC feed.
  describe('YouTube', () => {
    it.each([
      ['https://youtu.be/CYuh-WWmNLw', 'CYuh-WWmNLw'],
      ['https://youtu.be/PTSJxs6VHpo?si=gO3g6vQcCPYtKscP', 'PTSJxs6VHpo'],
      [
        'https://www.youtube.com/watch?v=O-arIu1TJHo&feature=youtu.be',
        'O-arIu1TJHo',
      ],
      ['https://www.youtube.com/shorts/dFqf1TQZAmQ', 'dFqf1TQZAmQ'],
    ])('parses %s', (url, id) => {
      expect(extractListingVideo([media(url)])).toEqual({
        kind: 'youtube',
        id,
        url,
      });
    });
  });

  describe('Vimeo', () => {
    it('parses a public share link', () => {
      const url = 'https://vimeo.com/1199632381?share=copy&fl=sv&fe=ci';
      expect(extractListingVideo([media(url)])).toEqual({
        kind: 'vimeo',
        id: '1199632381',
        url,
      });
    });

    it('keeps the hash of an unlisted video — the embed 401s without it', () => {
      const url = 'https://vimeo.com/1127670707/d71b763423?share=copy';
      expect(extractListingVideo([media(url)])).toEqual({
        kind: 'vimeo',
        id: '1127670707',
        hash: 'd71b763423',
        url,
      });
    });

    it('parses an already-embeddable player URL', () => {
      const url = 'https://player.vimeo.com/video/1212511601';
      expect(extractListingVideo([media(url)])).toEqual({
        kind: 'vimeo',
        id: '1212511601',
        url,
      });
    });

    it('ignores a non-numeric vimeo path (channel/showcase link)', () => {
      expect(extractListingVideo([media('https://vimeo.com/channels/staff')]))
        .toBeNull();
    });
  });

  describe('direct video file', () => {
    it('rewrites a Dropbox share link to its streamable host', () => {
      const url =
        'https://www.dropbox.com/scl/fi/2g8pfrh71yvo0wk7ikovt/Video.mp4?rlkey=dhwr9847hpi71f95vdidbvuyf&dl=0';
      const video = extractListingVideo([media(url)]);
      expect(video?.kind).toBe('file');
      expect(video?.url).toBe(
        'https://dl.dropboxusercontent.com/scl/fi/2g8pfrh71yvo0wk7ikovt/Video.mp4?rlkey=dhwr9847hpi71f95vdidbvuyf&raw=1',
      );
    });

    it('normalises a link already on the direct host', () => {
      const url =
        'https://dl.dropboxusercontent.com/scl/fi/h48xvsh29gwgpheqk5eyo/1-4432-Irmin-St.mp4?rlkey=172dzxcyfuxjmohgqlndymws9&raw=1';
      expect(extractListingVideo([media(url)])?.url).toBe(url);
    });

    it('rejects a Dropbox folder share — it has no raw stream', () => {
      const url =
        'https://www.dropbox.com/scl/fo/5y45tup7yb66a17jd57mp/AGF9tSHQIwjnL4LYpUT7F6s/Reel v2.mov?rlkey=ciyt1dut4b895pu98mtaqjgf6&dl=0';
      expect(extractListingVideo([media(url)])).toBeNull();
    });

    it('passes through a plain hosted file', () => {
      const url =
        'https://realtyvp.ca/wp-content/uploads/2026/06/503-138-E-Hastings-St-Vancouver-BC.mp4';
      expect(extractListingVideo([media(url)])).toEqual({ kind: 'file', url });
    });
  });

  describe('non-video media', () => {
    // ~53% of the 'Video Tour Website' category is not video at all.
    it.each([
      'https://my.matterport.com/show/?m=pT5BbpSFEpr',
      'https://youriguide.com/1234_main_st_vancouver_bc',
      'https://www.cotala.com/87322#vtour',
      'https://storyboard.onikon.com/12345',
      'https://www.instagram.com/reel/abc123/',
      'https://drive.google.com/file/d/abc/view',
    ])('rejects %s', (url) => {
      expect(extractListingVideo([media(url)])).toBeNull();
    });

    it('ignores video URLs filed outside the video-tour category', () => {
      expect(
        extractListingVideo([
          media('https://youtu.be/CYuh-WWmNLw', 'Sales Brochure Website'),
        ]),
      ).toBeNull();
    });

    it('returns null for a photos-only listing', () => {
      expect(
        extractListingVideo([
          media('https://ddfcdn.realtor.ca/x/R1_1.jpg', 'Property Photo'),
        ]),
      ).toBeNull();
    });
  });

  it('prefers a real player over a raw file when a listing has both', () => {
    const video = extractListingVideo([
      media('https://www.dropbox.com/scl/fi/a/b.mp4?rlkey=k&dl=0'),
      media('https://youtu.be/CYuh-WWmNLw'),
    ]);
    expect(video?.kind).toBe('youtube');
  });
});

describe('isPhotoMedia', () => {
  it('keeps photos and drops tour/video rows', () => {
    expect(isPhotoMedia(media('https://cdn/x.jpg', 'Property Photo'))).toBe(
      true,
    );
    expect(isPhotoMedia(media('https://youtu.be/CYuh-WWmNLw'))).toBe(false);
    expect(
      isPhotoMedia(media('https://vimeo.com/123', 'Property Photo')),
    ).toBe(false);
  });
});
