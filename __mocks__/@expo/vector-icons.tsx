const React = require('react');
const { Text } = require('react-native');

const Ionicons = ({ name, size, color, style, testID }: any) =>
  React.createElement(Text, { testID: testID ?? `icon-${name}`, style: [{ fontSize: size, color }, style] }, name);

module.exports = { Ionicons };
