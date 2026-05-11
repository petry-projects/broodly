module.exports = {
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  }),
};
