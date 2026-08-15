import * as lucide from 'lucide-react';
const icons = ['Search', 'Mail', 'ExternalLink', 'Briefcase', 'Calendar', 'MapPin', 'ChevronUp', 'ChevronDown', 'CheckCircle2', 'Clock', 'AlertTriangle', 'ChevronRight'];

const missing = icons.filter(icon => !lucide[icon]);
console.log('Missing icons:', missing);
