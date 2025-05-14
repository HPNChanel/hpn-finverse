// Simple readable-stream polyfill to fix crypto-browserify issues
export class Readable {
  constructor(options) {
    this.options = options || {};
    this._readableState = {
      objectMode: !!options?.objectMode,
      highWaterMark: options?.highWaterMark || 16384,
      buffer: [],
      length: 0,
      pipes: [],
      flowing: null,
      ended: false,
      endEmitted: false,
      reading: false,
      sync: true,
      needReadable: false,
      emittedReadable: false,
      readableListening: false,
      resumeScheduled: false,
      destroyed: false,
      defaultEncoding: 'utf8',
      awaitDrain: 0,
      readingMore: false,
      decoder: null,
      encoding: null
    };
  }

  // Minimal implementation
  _read() {}
  push() { return true; }
  pipe() { return this; }
  on() { return this; }
  once() { return this; }
}

export class Writable {
  constructor(options) {
    this.options = options || {};
    this._writableState = {
      objectMode: !!options?.objectMode,
      highWaterMark: options?.highWaterMark || 16384,
      finalCalled: false,
      needDrain: false,
      ending: false,
      ended: false,
      finished: false,
      destroyed: false,
      decodeStrings: true,
      defaultEncoding: 'utf8',
      length: 0,
      writing: false,
      corked: 0,
      sync: true,
      bufferProcessing: false,
      onwrite: () => {},
      writecb: null,
      writelen: 0,
      bufferedRequest: null,
      lastBufferedRequest: null,
      pendingcb: 0,
      prefinished: false,
      errorEmitted: false,
      emitClose: false,
      autoDestroy: false
    };
  }

  // Minimal implementation
  _write() {}
  end() { return this; }
  on() { return this; }
  once() { return this; }
}

export class Transform extends Readable {
  constructor(options) {
    super(options);
    this._transformState = {
      afterTransform: null,
      needTransform: false,
      transforming: false,
      writecb: null,
      writechunk: null,
      writeencoding: null
    };
  }

  _transform() {}
}

export class PassThrough extends Transform {
  _transform(chunk, encoding, cb) {
    cb(null, chunk);
  }
}

export class Duplex extends Readable {
  constructor(options) {
    super(options);
    Writable.call(this, options);
  }
}

// Patching _stream classes
Duplex.prototype = Object.create(Readable.prototype);
Object.setPrototypeOf(Duplex.prototype, Writable.prototype);
Duplex.prototype.constructor = Duplex;

// Export stream types
export default {
  Readable,
  Writable,
  Transform,
  PassThrough,
  Duplex
};
