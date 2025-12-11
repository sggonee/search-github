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

  try {
    const response = await fetch(baseUrl, { ...options });
    if (!response.ok) {
      return Promise.reject({ status: response.status, message: response.statusText });
    }
    return await response.json();
  } catch (error) {
    return Promise.reject(error);
  }
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
