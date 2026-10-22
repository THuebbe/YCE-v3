// Custom sign image limits, shared by the upload form and the server.
// Server action bodies are capped in next.config (serverActions.bodySizeLimit), so keep this under it.
export const SIGN_IMAGE_MAX_BYTES = 4 * 1024 * 1024
export const SIGN_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
