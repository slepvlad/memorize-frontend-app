const store: Record<string, string> = {};

const getItemAsync = jest.fn((key: string): Promise<string | null> =>
  Promise.resolve(store[key] ?? null)
);

const setItemAsync = jest.fn((key: string, value: string): Promise<void> => {
  store[key] = value;
  return Promise.resolve();
});

const deleteItemAsync = jest.fn((key: string): Promise<void> => {
  delete store[key];
  return Promise.resolve();
});

// Helper to reset the in-memory store between tests
const __reset = () => {
  Object.keys(store).forEach((k) => delete store[k]);
};

module.exports = { getItemAsync, setItemAsync, deleteItemAsync, __reset };
