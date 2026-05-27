export const collectDroppedFiles = async (dataTransfer) => {
  const items = Array.from(dataTransfer?.items || []);
  if (items.length === 0) {
    const fallbackFiles = Array.from(dataTransfer?.files || []);
    return fallbackFiles.map((file) => ({ file, relativePath: file.webkitRelativePath || file.relativePath || file.name }));
  }

  const entrySupported = typeof items[0]?.webkitGetAsEntry === 'function';
  if (!entrySupported) {
    return Array.from(dataTransfer?.files || []).map((file) => ({ file, relativePath: file.webkitRelativePath || file.relativePath || file.name }));
  }

  const readAllEntries = (directoryReader) => new Promise((resolve, reject) => {
    const collected = [];
    const readBatch = () => {
      directoryReader.readEntries((entries) => {
        if (!entries.length) {
          resolve(collected);
          return;
        }
        collected.push(...entries);
        readBatch();
      }, reject);
    };

    readBatch();
  });

  const readFileEntry = (entry, prefix = '') => new Promise((resolve, reject) => {
    entry.file((file) => {
      const relativePath = `${prefix}${file.name}`;
      try {
        Object.defineProperty(file, 'relativePath', { value: relativePath, configurable: true });
      } catch {
        file.relativePath = relativePath;
      }
      resolve([{ file, relativePath }]);
    }, reject);
  });

  const walkEntry = async (entry, prefix = '') => {
    if (!entry) return [];

    if (entry.isFile) {
      return readFileEntry(entry, prefix);
    }

    if (entry.isDirectory) {
      const reader = entry.createReader();
      const children = await readAllEntries(reader);
      const nested = await Promise.all(children.map((child) => walkEntry(child, `${prefix}${entry.name}/`)));
      return nested.flat();
    }

    return [];
  };

  const grouped = await Promise.all(items
    .map((item) => item.webkitGetAsEntry?.())
    .filter(Boolean)
    .map((entry) => walkEntry(entry)));

  return grouped.flat();
};

export const getUploadPathForFile = (file) => file?.webkitRelativePath || file?.relativePath || file?.name || 'upload';
