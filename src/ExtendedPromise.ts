class ExtendedPromise<T = void, E = unknown> extends Promise<T> {
  readonly createdAt = new Date();

  readonly onTimeout: <U = void>(
    cb: () => U | Promise<U>,
    timeout: number,
    ) => Promise<T | U>;
    
  readonly raceWith: <U>(...promises: Promise<U>[]) => Promise<T | U>;

  constructor(init?: InitPromise<T, E>) {
    let resolve = resolveUnknownError<T>;
    let reject = resolveUnknownError;

    super((resolveCb, rejectCb) => {
      resolve = resolveCb;
      reject = rejectCb;

      if (init) {
        init(resolve, reject);
      }
    });

    this.raceWith = <U>(...args: Promise<U>[]) => {
      return Promise.race([this, ...args]);
    };

    this.onTimeout = async <U>(
      cb: () => (U | Promise<U>),
      timeout: number,
    ) => {
      const value = await onTimeout(this, cb, timeout);

      return value;
    };
  }

  onTimeout<T = void, U = void>(
    promise: PromiseLike<T>,
    cb: () => (U | Promise<U>),
    timeout: number,
  ): Promise<T | U> {
    let resolved = false;
    let timeoutId: number;
  
    const timeoutPromise = new Promise<U>((resolve, reject) => {
      timeoutId = setTimeout(
        async () => {
          if (resolved) {
            return;
          }
  
          try {
            const value = await cb();
            resolve(value);
          } catch (err) {
            reject(err);
          }
        },
        timeout,
      )
    });
  
    
  
  }
}

type InitPromise<T, E = unknown> = (
  resolve: (val: T, promise: ExtendedPromise<T>) => void,
  reject: (reason: E, promise: ExtendedPromise<T>) => void,
) => void;

type NodeCallback<T> = T extends undefined
  ? (err: unknown) => void
  : (err: unknown, value: T) => void;

type ResolveCb<T> = T extends undefined
  ? () => void
  : (value: T) => void;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function resolveUnknownError<T>(value: T): void {
  throw new Error('Unexpected error');
}

export default ExtendedPromise;
export {
  onTimeout,
};
