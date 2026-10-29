// Maps a MIME type to 'image', 'pdf' or 'other'.
export const documentKind = (type) =>
  type?.startsWith('image/') ? 'image' : type === 'application/pdf' ? 'pdf' : 'other';
