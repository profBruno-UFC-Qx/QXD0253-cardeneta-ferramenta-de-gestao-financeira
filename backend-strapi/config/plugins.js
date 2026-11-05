const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedTypes = [
  'image/svg+xml',
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

module.exports = () => ({
  'users-permissions': {
    config: {
      jwtManagement: 'refresh',
      jwt: {
        expiresIn: '7d'
      },
      sessions: {
        httpOnly: true,
      },
    },
  },
  upload: {
    config: {
      sizeLimit: 5 * 1024 * 1024,
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes,
      },
    },
  },
});
