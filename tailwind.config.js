import { fontFamily } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
const config = {
	darkMode: ['class'],
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./src/**/**/*.{html,js,svelte,ts}',
	],
	safelist: ['dark'],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				background: '#28641C',
				foreground: '#2F260C',
				foregroundDark: '#272316',
				foregroundText: '#FFFFFF',
				textPrimary: '#E8F0F1',
				secondary: '#5A6E73',
				button: '#E2725B',
				buttonDisabled: '#35221E',
				textDisabled: '#7C7C7C',
				accent: '#E2725B', // Maybe this one - 965306
				accentText: '#DFE1D1',
				border: '#5A6E63',
				popover: '#FFFFFF',
				textHappy: 'rgb(60 228 27)',
				textDanger1: '#B03E3E',
				textDanger2: '#CC752E',
				textDanger3: '#CCA22E',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			fontFamily: {
				sans: [...fontFamily.sans],
			},
		},
	},
};

export default config;
