window.FileStore = {
  APP_DATA_DIR: 'data/',

  async save(tipo, nombre, blob) {
    const id = uuid();
    const ext = nombre.split('.').pop() || 'bin';
    const path = tipo + '/' + id + '.' + ext;
    const hash = await this._hashBlob(blob);
    const existing = await db._files.where('hash').equals(hash).first();
    if (existing) {
      existing.refCount = (existing.refCount || 1) + 1;
      existing.updatedAt = new Date();
      await db._files.put(existing);
      return { path: existing.path, hash: hash, url: await this.getURL(existing.path) };
    }
    await db._file_blobs.put({ path: path, blob: blob });
    await db._files.put({
      path: path,
      tipo: tipo,
      nombre: nombre,
      mime: blob.type || 'application/octet-stream',
      size: blob.size,
      hash: hash,
      refCount: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { path: path, hash: hash, url: await this.getURL(path) };
  },

  async getURL(path) {
    const entry = await db._file_blobs.get(path);
    if (!entry) return this.avatarDefault();
    return URL.createObjectURL(entry.blob);
  },

  async read(path) {
    const entry = await db._file_blobs.get(path);
    return entry ? entry.blob : null;
  },

  async delete(path) {
    const file = await db._files.get(path);
    if (file) {
      file.refCount = Math.max(0, (file.refCount || 1) - 1);
      if (file.refCount === 0) {
        await db._files.delete(path);
        await db._file_blobs.delete(path);
      } else {
        await db._files.put(file);
      }
    } else {
      await db._file_blobs.delete(path);
    }
  },

  async cleanOrphans() {
    const files = await db._files.where('refCount').equals(0).toArray();
    var count = 0;
    for (var i = 0; i < files.length; i++) {
      await db._files.delete(files[i].path);
      await db._file_blobs.delete(files[i].path);
      count++;
    }
    return count;
  },

  async meta(path) {
    return await db._files.get(path);
  },

  avatarDefault() {
    return 'data/defaults/avatar.svg';
  },

  async _hashBlob(blob) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var wordArray = CryptoJS.lib.WordArray.create(e.target.result);
        var hash = CryptoJS.SHA256(wordArray).toString();
        resolve(hash);
      };
      reader.onerror = function() { reject(new Error('Error reading blob')); };
      reader.readAsArrayBuffer(blob);
    });
  }
};
