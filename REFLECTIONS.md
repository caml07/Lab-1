# Reflections

## 1. POSIX resolution mechanics path.join vs. path.resolve)

On POSIX, path.join('/a', '../b') and path.resolve('/a', '../b') both evaluate to /b while having different argument processing resolution mechanics. path.join() performs argument concatenation and subsequent resolution of navigation metacharacters like .. and .. The resulting path is only absolute if the concatenated segments formed an absolute path during resolution. On the other hand, path.resolve() evaluates the arguments from right to left until an absolute path is resolved. If the provided arguments are not absolute, the current working directory is used as a resolution base.

This resolution mechanism can lead to a security flaw if a CLI argument is not properly sanitized and used to form a file path that is assumed to be within a specific directory. An adversary could potentially provide the CLI with a path like ../../secret.txt that would cause the final resolved path to point to a file outside of the intended directory. A similar issue can happen with a relative base path since its meaning depends on the current working directory during resolution. Neither path.join() nor path.resolve() are designed to validate safe path access, and the program must perform this additional check, ensuring that the resolved path is inside the expected directory, taking into account the possible symbolic links.

## 2. Concurrency and backpressure

Promise.all() triggers a readFile() for each .log file found in the directory. If the directory has 50,000 files, such a call might result in an EMFILE system error with the POSIX error code meaning 'Too many open files'. Node.js will reject the promise with the EMFILE error code.

Node.js has a limited number of filesystem operations that can be offloaded to the libuv thread pool, and many of the 50,000 operations would be stalled in the pool, consuming memory.

A worker pool addresses the first two issues by allowing only a limited number of concurrent operations. Batching can be used to perform groups of operations in sequence after completing a group. Streams can help manage memory by allowing to process a file in segments, however, there is still a memory overhead involved with keeping track of the stream state. Moreover, the number of streams must be limited as well to avoid the EMFILE system error.

## 3. Event loop lifecycle

When readFile() is called from node:fs/promises , the V8 JavaScript thread does not perform the file reading operation. Node.js forwards the request to the underlying filesystem via the libuv thread pool, where the actual file reading is performed by a worker thread. This allows the event loop to continue processing other requests.

Once the file reading operation is complete, the libuv event loop communicates the result back to the event loop thread. Node.js resolves or rejects the promise and schedules the JavaScript code waiting with await or .then() with the Promise microtask queue to be processed during the next event loop iteration.

## 4. Failure domains Promise.all vs. Promise.allSettled)

If the permissions for api.log are set to deny read access, its readFile() call will be rejected with the EACCES error code. Since the program uses Promise.all() to wait for all the readFile() promises, this error will trigger the catch handler, printing the Fatal I/O Error message and exiting with exit code 2. The program will not write the new report even if the individual readFile() calls for other files completed successfully. Note that an old report might be left in the output directory, appearing to be up-to-date.

For an enterprise CLI, I would use Promise.allSettled() to wait for all the readFile() promises to either resolve or reject. This approach would allow me to handle settled promises individually, writing the statistics for readable files and accumulating the error reasons for the files that were not read. The program can still exit with a nonzero exit code if any of the readFile() promises were rejected.

The chmod 000 example assumes that the program runs under a regular POSIX user. A privileged user such as root may still be able to read the file.
