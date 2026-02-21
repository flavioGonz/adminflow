const fs = require('fs');

const globalsPath = '/opt/adminflow/client/app/globals.css';
let globals = fs.readFileSync(globalsPath, 'utf8');

const mobileStyles = `

/* Mobile responsive utilities */
@media (max-width: 1023px) {
  /* Make tables horizontally scrollable */
  .overflow-x-auto {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  /* Ensure minimum table width for readability */
  table {
    min-width: 600px;
  }
  
  /* Stack cards on mobile */
  .mobile-stack {
    flex-direction: column !important;
  }
  
  /* Full width inputs on mobile */
  .mobile-full {
    width: 100% !important;
  }
  
  /* Hide on mobile */
  .mobile-hide {
    display: none !important;
  }
  
  /* Adjust padding for mobile */
  .mobile-p-2 {
    padding: 0.5rem !important;
  }
  
  /* Smaller text on mobile */
  .mobile-text-sm {
    font-size: 0.875rem !important;
  }
}

/* Show only on mobile */
@media (min-width: 1024px) {
  .desktop-hide {
    display: none !important;
  }
}

/* Touch-friendly tap targets */
@media (max-width: 1023px) {
  button, a, [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Better touch feedback */
  button:active, a:active, [role="button"]:active {
    opacity: 0.7;
  }
}

/* Safe area insets for notched devices */
@supports (padding: max(0px)) {
  .safe-area-bottom {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
  .safe-area-top {
    padding-top: max(1rem, env(safe-area-inset-top));
  }
}
`;

if (!globals.includes('/* Mobile responsive utilities */')) {
  globals += mobileStyles;
  fs.writeFileSync(globalsPath, globals);
  console.log('Added mobile styles to globals.css');
} else {
  console.log('Mobile styles already present in globals.css');
}
