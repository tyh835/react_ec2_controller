import React from 'react';
import { Menu, Header } from 'semantic-ui-react';

export default () => {
  return (
    <Menu fixed="top" fluid widths={1} inverted>
      <Menu.Item>
        <Header inverted as="h1">
          React EC2 Dashboard
        </Header>
      </Menu.Item>
    </Menu>
  );
};
