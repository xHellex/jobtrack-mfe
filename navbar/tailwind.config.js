module.exports = {
    content: ['./src/**/*.{ts,tsx,html}'],
    corePlugins: { preflight: false },
    // Las utilidades solo aplican dentro de la raíz del MFE y suben de especificidad: el Tailwind de otro MFE ya no las pisa
    important: '.jt-navbar',
    theme: {
        extend: {
            colors: {
                bg: 'var(--bg)',
                surface: 'var(--surface)',
                'surface-2': 'var(--surface-2)',
                border: 'var(--border)',
                text: 'var(--text)',
                muted: 'var(--text-muted)',
                accent: 'var(--accent)',
                'accent-hover': 'var(--accent-hover)',
                'on-accent': 'var(--on-accent)',
                'nav-bg': 'var(--nav-bg)',
                'nav-text': 'var(--nav-text)',
            },
            borderRadius: { DEFAULT: 'var(--radius)' },
            boxShadow: { card: 'var(--shadow)' },
        },
    },
};
