class ControllablePromise<T = void, E = unknown> extends Promise<T> {
  readonly createdAt = new Date();

  readonly nodeCallback: NodeCallback<T>;
  
  readonly onTimeout: <U = void>(
    cb: () => U | Promise<U>,
    timeout: number,
    ) => Promise<T | U>;
    
  readonly raceWith: <U>(...promises: Promise<U>[]) => Promise<T | U>;

  readonly reject: (reason: E) => void = resolveUnknownError;

  readonly resolve: (value: T) => void;

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

    this.resolve = resolve;
    this.reject = reject;

    this.nodeCallback = ((err: E, value: T) => {
      if (err) {
        this.reject(err);
      } else {
        this.resolve(value);
      }
    }) as NodeCallback<T>;

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
}

async function onTimeout<T = void, U = void>(
  promise: PromiseLike<T>,
  cb: () => (U | Promise<U>),
  timeout: number,
): Promise<T | U> {
  const endPromise = new ControllablePromise<T | U>();
  let resolved = false;

  const timer = setTimeout(
    async () => {
      if (resolved) {
        return;
      }

      try {
        const value = await cb();
        endPromise.resolve(value);
      } catch (err) {
        endPromise.reject(err);
      }
    },
    timeout,
  );

  void promise.then((value) => {
    endPromise.resolve(value);
    clearTimeout(timer);
    resolved = true;
  });

  const val = await endPromise;

  return val;
}

type InitPromise<T, E = unknown> = (
  resolve: (val: T, promise: ControllablePromise<T>) => void,
  reject: (reason: E, promise: ControllablePromise<T>) => void,
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

export default ControllablePromise;
export {
  onTimeout,
};
