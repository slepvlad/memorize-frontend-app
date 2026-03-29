const React = require('react');
const { View } = require('react-native');

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
  dismiss: jest.fn(),
};

const useRouter = jest.fn(() => mockRouter);
const useSegments = jest.fn(() => [] as string[]);
const useLocalSearchParams = jest.fn(() => ({}));
const useFocusEffect = jest.fn();
const usePathname = jest.fn(() => '/');

const Link = ({ children, href, ...props }: any) =>
  React.createElement(View, { testID: `link-${href}`, ...props }, children);

const Stack = ({ children }: any) => React.createElement(React.Fragment, null, children);
Stack.Screen = ({ children }: any) => (children ? React.createElement(React.Fragment, null, children) : null);

const Tabs = ({ children }: any) => React.createElement(React.Fragment, null, children);
Tabs.Screen = ({ children }: any) => (children ? React.createElement(React.Fragment, null, children) : null);

const Redirect = ({ href }: any) => React.createElement(View, { testID: `redirect-${href}` });

module.exports = {
  useRouter,
  useSegments,
  useLocalSearchParams,
  useFocusEffect,
  usePathname,
  Link,
  Stack,
  Tabs,
  Redirect,
  _mockRouter: mockRouter, // expose for assertions
};
