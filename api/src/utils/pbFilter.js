// Covers the PocketBase filter expressions used by the existing web client.
// Keeping this translation here makes the UI migration incremental and avoids
// exposing arbitrary MongoDB queries to the browser.
export function pocketBaseFilter(expression = '') {
  if (!expression || !expression.trim()) return {};
  const split = (value, separator) => {
    const output = []; let depth = 0; let start = 0;
    for (let i = 0; i < value.length; i += 1) {
      if (value[i] === '(') depth += 1;
      if (value[i] === ')') depth -= 1;
      if (depth === 0 && value.slice(i, i + separator.length) === separator) { output.push(value.slice(start, i).trim()); start = i + separator.length; i += separator.length - 1; }
    }
    output.push(value.slice(start).trim()); return output;
  };
  const parseValue = (raw) => {
    const value = raw.trim().replace(/^['"]|['"]$/g, '').replace(/\\"/g, '"');
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    return value;
  };
  const parseCondition = (condition) => {
    const match = condition.trim().replace(/^\(|\)$/g, '').match(/^([\w.]+)\s*(=|!=|~|>=|<=|>|<)\s*(.+)$/);
    if (!match) return null;
    const [, field, operator, raw] = match; const value = parseValue(raw);
    if (operator === '~') return { [field]: { $regex: String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } };
    if (operator === '!=') return { [field]: { $ne: value } };
    if (operator === '=') return { [field]: value };
    return { [field]: { [`$${operator === '>' ? 'gt' : operator === '>=' ? 'gte' : operator === '<' ? 'lt' : 'lte'}`]: Number(value) } };
  };
  const conditions = split(expression, '&&'); const filter = {};

  for (const condition of conditions) {
    const options = split(condition.trim().replace(/^\(|\)$/g, ''), '||').map(parseCondition).filter(Boolean);
    if (options.length === 1) Object.assign(filter, options[0]);
    else if (options.length > 1) filter.$and = [...(filter.$and || []), { $or: options }];
  }
  return filter;
}

export function sortFromPocketBase(sort = '') {
  return Object.fromEntries(sort.split(',').filter(Boolean).map((field) => [field.replace(/^-/, ''), field.startsWith('-') ? -1 : 1]));
}
