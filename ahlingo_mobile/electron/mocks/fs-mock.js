// Mock implementation of react-native-fs for Electron
// In a production app, you would use Electron's file system APIs

const RNFS = {
  DocumentDirectoryPath: '/documents',
  CachesDirectoryPath: '/caches',
  ExternalStorageDirectoryPath: '/storage',
  DownloadDirectoryPath: '/downloads',

  readDir: (path) => {
    console.warn('RNFS mock: readDir:', path);
    return Promise.resolve([]);
  },

  readFile: (path, encoding = 'utf8') => {
    console.warn('RNFS mock: readFile:', path);
    return Promise.resolve('');
  },

  writeFile: (path, contents, encoding = 'utf8') => {
    console.warn('RNFS mock: writeFile:', path);
    return Promise.resolve();
  },

  exists: (path) => {
    console.warn('RNFS mock: exists:', path);
    return Promise.resolve(false);
  },

  mkdir: (path) => {
    console.warn('RNFS mock: mkdir:', path);
    return Promise.resolve();
  },

  unlink: (path) => {
    console.warn('RNFS mock: unlink:', path);
    return Promise.resolve();
  },

  stat: (path) => {
    console.warn('RNFS mock: stat:', path);
    return Promise.resolve({});
  },

  copyFile: (from, to) => {
    console.warn('RNFS mock: copyFile:', from, to);
    return Promise.resolve();
  },

  moveFile: (from, to) => {
    console.warn('RNFS mock: moveFile:', from, to);
    return Promise.resolve();
  },

  downloadFile: (options) => {
    console.warn('RNFS mock: downloadFile:', options);
    return {
      promise: Promise.resolve({ statusCode: 200, bytesWritten: 0 })
    };
  }
};

export default RNFS;
