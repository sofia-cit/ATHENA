/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidiana: '#070C16', // fondo principal de la app
        pizarra: '#0F172A', // superficies: tarjetas, header, barra inferior
        borde: '#1E293B', // bordes sutiles
        inputbg: '#0B1220', // fondo de inputs
        gold: { DEFAULT: '#D6C59A', hover: '#E5D7B2' }, // acento de marca Athena
        tinta: '#F8FAFC', // texto principal
        niebla: '#94A3B8', // texto secundario / subtitulos
      },
      boxShadow: {
        'gold-glow': '0 10px 30px -12px rgba(214,197,154,0.45)',
      },
    },
  },
  plugins: [],
}
