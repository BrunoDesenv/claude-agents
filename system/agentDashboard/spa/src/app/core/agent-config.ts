export interface AgentConfig {
  name: string;
  color: string;
  darkColor: string;
  label: string;
  svgContent: string;
}

// Each SVG is 120×160, inline — status dot colour set via CSS variable
const skin = '#fde68a';
const skinStroke = '#d97706';
const dark = '#1c1917';
const shoe = '#1c1917';

function baseHead(cx = 60, cy = 32): string {
  return `
    <circle cx="${cx}" cy="${cy}" r="21" fill="${skin}" stroke="${skinStroke}" stroke-width="1.5"/>
    <circle cx="${cx - 7}" cy="${cy - 3}" r="2.5" fill="${dark}"/>
    <circle cx="${cx + 7}" cy="${cy - 3}" r="2.5" fill="${dark}"/>
    <circle cx="${cx - 5.5}" cy="${cy - 4.5}" r="1" fill="white"/>
    <circle cx="${cx + 8.5}" cy="${cy - 4.5}" r="1" fill="white"/>
    <path d="M${cx - 7} ${cy + 7} Q${cx} ${cy + 12} ${cx + 7} ${cy + 7}" fill="none" stroke="${skinStroke}" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="${cx - 21}" cy="${cy}" r="5" fill="${skin}" stroke="${skinStroke}" stroke-width="1"/>
    <circle cx="${cx + 21}" cy="${cy}" r="5" fill="${skin}" stroke="${skinStroke}" stroke-width="1"/>
    <rect x="${cx - 6}" y="${cy + 18}" width="12" height="9" fill="${skin}"/>`;
}

function baseLegs(color: string, darkColor: string): string {
  return `
    <rect x="41" y="107" width="15" height="32" rx="7" fill="${darkColor}"/>
    <rect x="64" y="107" width="15" height="32" rx="7" fill="${darkColor}"/>
    <ellipse cx="48" cy="139" rx="13" ry="6" fill="${shoe}"/>
    <ellipse cx="72" cy="139" rx="13" ry="6" fill="${shoe}"/>`;
}

const MASTER_SVG = `
  ${baseHead()}
  <path d="M39 29 Q41 10 60 10 Q79 10 81 29 Q76 18 60 17 Q44 18 39 29 Z" fill="${dark}"/>
  <rect x="36" y="57" width="48" height="52" rx="9" fill="#7c3aed"/>
  <polygon points="60,61 52,80 60,76 68,80" fill="#a78bfa"/>
  <rect x="57" y="61" width="6" height="18" fill="white"/>
  <rect x="57" y="72" width="6" height="3" fill="#e11d48"/>
  <line x1="36" y1="68" x2="13" y2="89" stroke="#7c3aed" stroke-width="9" stroke-linecap="round"/>
  <line x1="84" y1="68" x2="101" y2="80" stroke="#7c3aed" stroke-width="9" stroke-linecap="round"/>
  <rect x="97" y="73" width="18" height="25" rx="3" fill="#f9fafb" stroke="#9ca3af" stroke-width="1.5"/>
  <rect x="103" y="70" width="6" height="5" rx="2" fill="#9ca3af"/>
  <line x1="101" y1="81" x2="111" y2="81" stroke="#9ca3af" stroke-width="1.5"/>
  <line x1="101" y1="86" x2="111" y2="86" stroke="#9ca3af" stroke-width="1.5"/>
  <line x1="101" y1="91" x2="111" y2="91" stroke="#9ca3af" stroke-width="1.5"/>
  ${baseLegs('#7c3aed', '#5b21b6')}`;

const ARCHITECT_SVG = `
  ${baseHead()}
  <path d="M39 29 Q41 10 60 10 Q79 10 81 29" fill="none" stroke="${dark}" stroke-width="3"/>
  <path d="M36 25 Q60 15 84 25 L88 30 Q60 20 32 30 Z" fill="#fbbf24"/>
  <rect x="54" y="12" width="12" height="8" rx="2" fill="#fbbf24"/>
  <rect x="36" y="57" width="48" height="52" rx="9" fill="#2563eb"/>
  <rect x="48" y="63" width="24" height="16" rx="3" fill="#dbeafe" opacity="0.8"/>
  <line x1="52" y1="67" x2="68" y2="67" stroke="#2563eb" stroke-width="1"/>
  <line x1="52" y1="71" x2="68" y2="71" stroke="#2563eb" stroke-width="1"/>
  <line x1="52" y1="75" x2="68" y2="75" stroke="#2563eb" stroke-width="1"/>
  <line x1="36" y1="68" x2="13" y2="89" stroke="#2563eb" stroke-width="9" stroke-linecap="round"/>
  <line x1="84" y1="68" x2="100" y2="82" stroke="#2563eb" stroke-width="9" stroke-linecap="round"/>
  <ellipse cx="107" cy="86" rx="11" ry="7" fill="#bfdbfe" stroke="#93c5fd" stroke-width="1.5" transform="rotate(-20,107,86)"/>
  <line x1="96" y1="82" x2="100" y2="86" stroke="#1d4ed8" stroke-width="2"/>
  ${baseLegs('#2563eb', '#1d4ed8')}`;

const BACKEND_SVG = `
  ${baseHead()}
  <path d="M39 30 Q41 11 60 11 Q79 11 81 30 Q70 22 60 21 Q50 22 39 30 Z" fill="${dark}"/>
  <rect x="36" y="57" width="48" height="52" rx="9" fill="#16a34a"/>
  <circle cx="60" cy="83" r="10" fill="#15803d" stroke="#bbf7d0" stroke-width="1.5"/>
  <path d="M55 83 L58 86 L65 79" fill="none" stroke="#bbf7d0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="36" y1="68" x2="13" y2="89" stroke="#16a34a" stroke-width="9" stroke-linecap="round"/>
  <line x1="84" y1="68" x2="100" y2="80" stroke="#16a34a" stroke-width="9" stroke-linecap="round"/>
  <line x1="96" y1="78" x2="114" y2="82" stroke="#78716c" stroke-width="5" stroke-linecap="round"/>
  <line x1="96" y1="78" x2="98" y2="68" stroke="#78716c" stroke-width="5" stroke-linecap="round"/>
  <line x1="110" y1="80" x2="118" y2="72" stroke="#78716c" stroke-width="3" stroke-linecap="round"/>
  ${baseLegs('#16a34a', '#15803d')}`;

const FRONTEND_SVG = `
  ${baseHead()}
  <path d="M39 29 Q50 16 60 14 Q70 16 81 29 Q73 22 60 22 Q47 22 39 29 Z" fill="#0e7490"/>
  <rect x="54" y="11" width="12" height="8" rx="4" fill="#0e7490"/>
  <rect x="36" y="57" width="48" height="52" rx="9" fill="#0891b2"/>
  <rect x="44" y="63" width="32" height="20" rx="3" fill="#0e7490"/>
  <path d="M49 72 L53 68 L57 74 L61 66 L65 72 L68 69 L72 72" fill="none" stroke="#67e8f9" stroke-width="2" stroke-linecap="round"/>
  <line x1="36" y1="68" x2="13" y2="86" stroke="#0891b2" stroke-width="9" stroke-linecap="round"/>
  <line x1="84" y1="68" x2="101" y2="80" stroke="#0891b2" stroke-width="9" stroke-linecap="round"/>
  <line x1="97" y1="75" x2="114" y2="68" stroke="#d97706" stroke-width="3" stroke-linecap="round"/>
  <circle cx="114" cy="67" r="4" fill="#fbbf24"/>
  <circle cx="97" cy="75" r="3" fill="#78716c"/>
  ${baseLegs('#0891b2', '#0e7490')}`;

const QA_SVG = `
  ${baseHead()}
  <path d="M39 30 Q42 12 60 11 Q78 12 81 30 Q76 20 60 19 Q44 20 39 30 Z" fill="${dark}"/>
  <rect x="36" y="57" width="48" height="52" rx="9" fill="#ea580c"/>
  <rect x="44" y="63" width="32" height="6" rx="3" fill="#fed7aa"/>
  <line x1="60" y1="69" x2="60" y2="107" stroke="#fed7aa" stroke-width="2"/>
  <line x1="36" y1="68" x2="13" y2="89" stroke="#ea580c" stroke-width="9" stroke-linecap="round"/>
  <line x1="84" y1="68" x2="101" y2="81" stroke="#ea580c" stroke-width="9" stroke-linecap="round"/>
  <circle cx="107" cy="85" r="9" fill="none" stroke="#fbbf24" stroke-width="3"/>
  <line x1="113" y1="91" x2="119" y2="98" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
  ${baseLegs('#ea580c', '#c2410c')}`;

const VALIDATOR_SVG = `
  ${baseHead()}
  <path d="M39 30 Q50 10 60 9 Q70 10 81 30 Q73 19 60 18 Q47 19 39 30 Z" fill="${dark}"/>
  <rect x="30" y="57" width="60" height="52" rx="9" fill="#dc2626"/>
  <path d="M30 62 L60 57 L90 62 L90 85 Q60 105 30 85 Z" fill="#b91c1c"/>
  <line x1="30" y1="68" x2="8" y2="86" stroke="#dc2626" stroke-width="9" stroke-linecap="round"/>
  <line x1="90" y1="68" x2="104" y2="80" stroke="#dc2626" stroke-width="9" stroke-linecap="round"/>
  <line x1="100" y1="75" x2="109" y2="84" stroke="#78716c" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="106" cy="87" rx="6" ry="4" fill="#78716c"/>
  <line x1="103" y1="88" x2="96" y2="96" stroke="#78716c" stroke-width="5" stroke-linecap="round"/>
  <path d="M48 84 L54 90 L72 76" fill="none" stroke="#fef2f2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  ${baseLegs('#dc2626', '#991b1b')}`;

const RESEARCHER_SVG = `
  ${baseHead()}
  <path d="M38 29 Q52 18 60 17 Q68 18 82 29 Q74 21 60 20 Q46 21 38 29 Z" fill="#92400e"/>
  <circle cx="52" cy="29" r="5" fill="none" stroke="#a16207" stroke-width="2"/>
  <circle cx="68" cy="29" r="5" fill="none" stroke="#a16207" stroke-width="2"/>
  <line x1="57" y1="29" x2="63" y2="29" stroke="#a16207" stroke-width="2"/>
  <rect x="36" y="57" width="48" height="52" rx="9" fill="#ca8a04"/>
  <rect x="44" y="63" width="32" height="38" rx="3" fill="#fef3c7" opacity="0.9"/>
  <line x1="49" y1="70" x2="71" y2="70" stroke="#ca8a04" stroke-width="1.5"/>
  <line x1="49" y1="75" x2="71" y2="75" stroke="#ca8a04" stroke-width="1.5"/>
  <line x1="49" y1="80" x2="71" y2="80" stroke="#ca8a04" stroke-width="1.5"/>
  <line x1="49" y1="85" x2="65" y2="85" stroke="#ca8a04" stroke-width="1.5"/>
  <line x1="36" y1="68" x2="13" y2="88" stroke="#ca8a04" stroke-width="9" stroke-linecap="round"/>
  <line x1="84" y1="68" x2="101" y2="80" stroke="#ca8a04" stroke-width="9" stroke-linecap="round"/>
  <rect x="97" y="73" width="8" height="12" rx="1" fill="#fef3c7" stroke="#ca8a04" stroke-width="1"/>
  <rect x="95" y="72" width="12" height="4" rx="1" fill="#ca8a04"/>
  <line x1="101" y1="85" x2="101" y2="98" stroke="#78716c" stroke-width="2.5" stroke-linecap="round"/>
  ${baseLegs('#ca8a04', '#92400e')}`;

const UX_SVG = `
  ${baseHead()}
  <path d="M60 11 Q48 13 42 20 L39 30 Q46 16 60 14 Q74 16 81 30 L78 20 Q72 13 60 11 Z" fill="${dark}"/>
  <circle cx="60" cy="10" r="5" fill="${dark}"/>
  <rect x="36" y="57" width="48" height="52" rx="9" fill="#db2777"/>
  <rect x="42" y="65" width="36" height="26" rx="3" fill="#fdf2f8"/>
  <path d="M47 75 Q52 68 57 75 Q62 82 67 75 Q72 68 77 75" fill="none" stroke="#db2777" stroke-width="2" stroke-linecap="round"/>
  <line x1="36" y1="68" x2="14" y2="86" stroke="#db2777" stroke-width="9" stroke-linecap="round"/>
  <line x1="84" y1="68" x2="101" y2="80" stroke="#db2777" stroke-width="9" stroke-linecap="round"/>
  <rect x="96" y="72" width="14" height="10" rx="2" fill="#fdf2f8" stroke="#db2777" stroke-width="1.5"/>
  <line x1="100" y1="82" x2="103" y2="90" stroke="#be185d" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="103" cy="91" r="2" fill="#be185d"/>
  ${baseLegs('#db2777', '#be185d')}`;

const DOCUMENTATION_SVG = `
  ${baseHead()}
  <path d="M39 32 Q42 12 60 11 Q78 12 81 32 Q74 21 60 20 Q46 21 39 32 Z" fill="#4b5563"/>
  <circle cx="53" cy="29" r="5" fill="none" stroke="#6b7280" stroke-width="2"/>
  <circle cx="67" cy="29" r="5" fill="none" stroke="#6b7280" stroke-width="2"/>
  <line x1="58" y1="29" x2="62" y2="29" stroke="#6b7280" stroke-width="2"/>
  <rect x="36" y="57" width="48" height="52" rx="9" fill="#6b7280"/>
  <ellipse cx="60" cy="80" rx="14" ry="18" fill="#f9fafb" stroke="#9ca3af" stroke-width="1.5"/>
  <line x1="52" y1="72" x2="68" y2="72" stroke="#9ca3af" stroke-width="1.5"/>
  <line x1="51" y1="77" x2="69" y2="77" stroke="#9ca3af" stroke-width="1.5"/>
  <line x1="51" y1="82" x2="69" y2="82" stroke="#9ca3af" stroke-width="1.5"/>
  <line x1="51" y1="87" x2="65" y2="87" stroke="#9ca3af" stroke-width="1.5"/>
  <line x1="36" y1="68" x2="13" y2="86" stroke="#6b7280" stroke-width="9" stroke-linecap="round"/>
  <line x1="84" y1="68" x2="100" y2="80" stroke="#6b7280" stroke-width="9" stroke-linecap="round"/>
  <path d="M97 78 Q104 72 107 80 Q110 88 103 90 L97 88 Z" fill="#fef3c7" stroke="#d97706" stroke-width="1"/>
  <line x1="109" y1="72" x2="107" y2="80" stroke="#d97706" stroke-width="2.5" stroke-linecap="round"/>
  ${baseLegs('#6b7280', '#4b5563')}`;

const FORGE_SVG = `
  ${baseHead()}
  <path d="M37 31 Q42 10 60 10 Q78 10 83 31 Q76 19 60 18 Q44 19 37 31 Z" fill="${dark}"/>
  <rect x="32" y="57" width="56" height="56" rx="9" fill="#92400e"/>
  <path d="M40 65 L80 65 L76 95 Q60 105 44 95 Z" fill="#78350f" opacity="0.6"/>
  <rect x="48" y="63" width="24" height="6" rx="2" fill="#d97706"/>
  <line x1="32" y1="68" x2="10" y2="86" stroke="#92400e" stroke-width="11" stroke-linecap="round"/>
  <line x1="88" y1="68" x2="105" y2="80" stroke="#92400e" stroke-width="11" stroke-linecap="round"/>
  <rect x="99" y="68" width="5" height="18" rx="2" fill="#78716c"/>
  <ellipse cx="101" cy="66" rx="9" ry="5" fill="#6b7280"/>
  <rect x="95" y="87" width="22" height="6" rx="3" fill="#4b5563"/>
  ${baseLegs('#92400e', '#78350f')}`;

export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  master:        { name: 'master',        color: '#7c3aed', darkColor: '#5b21b6', label: 'Master',       svgContent: MASTER_SVG },
  architect:     { name: 'architect',     color: '#2563eb', darkColor: '#1d4ed8', label: 'Architect',    svgContent: ARCHITECT_SVG },
  backend:       { name: 'backend',       color: '#16a34a', darkColor: '#15803d', label: 'Backend',      svgContent: BACKEND_SVG },
  frontend:      { name: 'frontend',      color: '#0891b2', darkColor: '#0e7490', label: 'Frontend',     svgContent: FRONTEND_SVG },
  qa:            { name: 'qa',            color: '#ea580c', darkColor: '#c2410c', label: 'QA',           svgContent: QA_SVG },
  validator:     { name: 'validator',     color: '#dc2626', darkColor: '#991b1b', label: 'Validator',    svgContent: VALIDATOR_SVG },
  researcher:    { name: 'researcher',    color: '#ca8a04', darkColor: '#92400e', label: 'Researcher',   svgContent: RESEARCHER_SVG },
  ux:            { name: 'ux',            color: '#db2777', darkColor: '#be185d', label: 'UX',           svgContent: UX_SVG },
  documentation: { name: 'documentation', color: '#6b7280', darkColor: '#4b5563', label: 'Docs',         svgContent: DOCUMENTATION_SVG },
  forge:         { name: 'forge',         color: '#92400e', darkColor: '#78350f', label: 'Forge',        svgContent: FORGE_SVG },
};

export function getAgentConfig(name: string): AgentConfig {
  return AGENT_CONFIGS[name] ?? {
    name, color: '#6b7280', darkColor: '#4b5563', label: name,
    svgContent: MASTER_SVG
  };
}
