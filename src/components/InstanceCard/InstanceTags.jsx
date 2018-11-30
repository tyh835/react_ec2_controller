import React from 'react';
import { Label } from 'semantic-ui-react';

const InstanceTags = ({ tags }) => {
  return (
    <>
      {tags.map(tag => (
        <Label className="instance__label">
          {tag.Key}: {tag.Value}
        </Label>
      ))}
    </>
  );
};

export default InstanceTags;
