let config = {};

// Files to exclude. Supports glob syntax via minimatch.
config.excludes = [
    '.*',
    '_metadata.yml',
    '_config.yml'
];
// Files to force include relative to the source directory.
// Example: .htaccess
config.includes = [];

// Should syntax be highlighted.
config.highlightSyntax = false;

config.verbose = false;

export default config;
