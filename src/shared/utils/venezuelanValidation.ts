/**
 * Venezuelan ID (Cédula/RIF) validation utilities
 */

// Validate Venezuelan Cédula format (V-12345678 or 12345678)
export function validateCedula(cedula: string): boolean {
  // Remove V- or J- prefix and hyphens
  const cleaned = cedula.replace(/[VJvj-]/g, '').trim();
  
  // Must be 6-8 digits
  if (!/^\d{6,8}$/.test(cleaned)) {
    return false;
  }
  
  return true;
}

// Validate Venezuelan RIF format (J-12345678-9 or V-12345678-9)
export function validateRif(rif: string): boolean {
  // Remove hyphens and convert to uppercase
  const cleaned = rif.replace(/-/g, '').toUpperCase().trim();
  
  // Must start with J, V, G, or E followed by 8-9 digits
  if (!/^[JVGE]\d{8,9}$/.test(cleaned)) {
    return false;
  }
  
  return true;
}

// Format Cédula (12345678 -> V-12.345.678)
export function formatCedula(cedula: string): string {
  const cleaned = cedula.replace(/[VJvj-\s.]/g, '');
  
  if (!/^\d{6,8}$/.test(cleaned)) {
    return cedula; // Return as is if invalid
  }
  
  // Add V- prefix and format with dots
  return `V-${cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

// Format RIF (J123456789 -> J-12345678-9)
export function formatRif(rif: string): string {
  const cleaned = rif.replace(/[-\s]/g, '').toUpperCase();
  
  if (!/^[JVGE]\d{8,9}$/.test(cleaned)) {
    return rif; // Return as is if invalid
  }
  
  const letter = cleaned[0];
  const numbers = cleaned.slice(1);
  
  if (numbers.length === 9) {
    return `${letter}-${numbers.slice(0, 8)}-${numbers[8]}`;
  } else {
    return `${letter}-${numbers}`;
  }
}

// Validate and format Venezuelan phone (04241234567 -> 0424-123-4567)
export function formatVenezuelanPhone(phone: string): string {
  const cleaned = phone.replace(/[-\s]/g, '');
  
  if (!/^0\d{10}$/.test(cleaned)) {
    return phone; // Return as is if invalid
  }
  
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
}

// Validate Venezuelan phone
export function validateVenezuelanPhone(phone: string): boolean {
  const cleaned = phone.replace(/[-\s]/g, '');
  return /^0(412|414|424|416|426)\d{7}$/.test(cleaned);
}

// Format bank account number (01020123456789012345 -> 0102-0123-45-6789012345)
export function formatAccountNumber(account: string): string {
  const cleaned = account.replace(/[-\s]/g, '');
  
  if (!/^\d{20}$/.test(cleaned)) {
    return account; // Return as is if invalid
  }
  
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 10)}-${cleaned.slice(10)}`;
}

// Validate Venezuelan account number (20 digits)
export function validateAccountNumber(account: string): boolean {
  const cleaned = account.replace(/[-\s]/g, '');
  return /^\d{20}$/.test(cleaned);
}
