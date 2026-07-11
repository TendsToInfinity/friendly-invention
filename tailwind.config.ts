import type { Config } from 'tailwindcss';
export default {content:['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}','./features/**/*.{ts,tsx}'],theme:{extend:{colors:{brand:{50:'#eef7ff',100:'#d9edff',500:'#3b82f6',600:'#2563eb'},violet:'#7c3aed',teal:'#14b8a6'},boxShadow:{soft:'0 18px 45px rgba(38,68,120,.12)'},borderRadius:{'2xl':'1.25rem'}}},plugins:[]} satisfies Config;
