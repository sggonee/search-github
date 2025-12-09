const mergeOptions = (defaultOptions: Record<string, unknown>, mergedOptions: Record<string, unknown> = {}) => {
  return {
    ...defaultOptions,
    ...mergedOptions,
    headers: {
      ...(defaultOptions.headers || {}),
      ...(mergedOptions.headers || {}),
    },
  };
};

const _fetch = async (path: string, options?: Record<string, unknown>) => {
  const query = options?.params ? `?` + new URLSearchParams(options.params as URLSearchParams) : '';
  const baseUrl = `${path}${query}`;
  return fetch(baseUrl, { ...options }).then((response: Response) => {
    return response.text().then((text) => {
      if (!text) return;
      try {
        const data = JSON.parse(text);
        if (!response.ok) return Promise.reject(data);
        return data;
      } catch (err) {
        return Promise.reject({
          code: 500,
          message: 'INTERNAL SERVER ERROR',
          cause: 'UNKNOWN ERROR',
        });
      }
    });
  });
};

const _get = (baseUrl: string, options?: Record<string, unknown>) => {
  const mergedOptions = mergeOptions(
    {
      method: 'GET',
    },
    options,
  );

  return _fetch(baseUrl, mergedOptions);
};

const http = {
  get: _get,
};

export default http;
