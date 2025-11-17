import fs from 'fs';
import path from 'path';

const templatesPath = path.join(process.cwd(), 'config', 'templates.json');
let templates = {};

try {
  const data = fs.readFileSync(templatesPath, 'utf8');
  templates = JSON.parse(data);
  console.log('[INFO] Templates loaded successfully');
} catch (err) {
  console.error('[ERROR] Failed to load templates:', err);
  process.exit(1);
}

/**
 * Format message using template and data
 * @param {string} template - Template string with placeholders
 * @param {object} data - Data object
 * @returns {string} Formatted message
 */
function formatTemplate(template, data) {
  const missingFields = [];
  const result = template.replace(/\{(\w+)\}/g, (match, key) => {
    if (data[key] === undefined) {
      missingFields.push(key);
      return match;
    }
    // Округляем числовые значения до 2 знаков после запятой
    if (typeof data[key] === 'number') {
      return parseFloat(data[key].toFixed(2));
    }
    return data[key];
  });
  
  if (missingFields.length > 0) {
    console.warn(`[WARN] Missing fields in template data: ${missingFields.join(', ')}`);
  }
  
  return result;
}

/**
 * Get formatted message for alert
 * @param {string} type - Alert type (e.g. 'StackAutoUpdated')
 * @param {string} status - Alert status (e.g. 'OK')
 * @param {object} data - Alert data
 * @returns {string|null} Formatted message or null if template not found
 */
export function getMessage(type, status, data) {
  try {
    const template = templates[type]?.[status];
    if (!template) {
      console.warn(`[WARN] No template found for type: ${type}, status: ${status}`);
      return null;
    }
    return formatTemplate(template, data);
  } catch (err) {
    console.error(`[ERROR] Failed to generate message: ${err.message}`);
    return null;
  }
}