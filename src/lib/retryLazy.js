import React from 'react';

export function withRetry(importer, retries = 2, delay = 1000) {
  let attempt = 0;

  const load = () =>
    importer().catch((err) => {
      if (attempt < retries) {
        attempt += 1;
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            load().then(resolve).catch(reject);
          }, delay);
        });
      }
      throw err;
    });

  return React.lazy(load);
}

export default withRetry;
