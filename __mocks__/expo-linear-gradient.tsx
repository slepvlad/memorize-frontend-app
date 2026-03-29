const React = require('react');
const { View } = require('react-native');

const LinearGradient = ({ children, style, ...props }: any) =>
  React.createElement(View, { style, testID: 'linear-gradient', ...props }, children);

module.exports = { LinearGradient };
