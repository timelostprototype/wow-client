export const delay = async (timeout: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, timeout));
