// Simple path polyfill for browser
export function join(...parts) {
  return parts.join('/').replace(/\/+/g, '/');
}

export function resolve(...parts) {
  return join(...parts);
}

export function dirname(path) {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/');
}

export function basename(path, ext) {
  const name = path.split('/').pop();
  if (ext && name.endsWith(ext)) {
    return name.slice(0, -ext.length);
  }
  return name;
}

export function extname(path) {
  const parts = path.split('.');
  if (parts.length <= 1) {
    return '';
  }
  return '.' + parts.pop();
}

export default {
  join,
  resolve,
  dirname,
  basename,
  extname,
  sep: '/'
};
