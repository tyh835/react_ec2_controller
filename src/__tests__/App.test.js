import React from 'react';
import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import App from '../components/App.jsx';

configure({ adapter: new Adapter() });

describe('<App />', () => {
  it('renders without crashing', () => {
    const wrapper = shallow(<App />);
    expect(wrapper).toMatchSnapshot();
  });

  it('renders with empty states', () => {
    const wrapper = shallow(<App />);
    expect(wrapper.state().instances.length).toEqual(0);
    expect(wrapper.state().error).toEqual('');
  });

  it('correctly renders error message', () => {
    const wrapper = mount(<App />);
    const message = 'this is a test message';

    expect(wrapper.find('Message').length).toEqual(0);
    wrapper.setState({ error: message });
    expect(wrapper.find('Message').length).toEqual(1);
    expect(wrapper.find('Message').prop('content')).toEqual(message);
  });

  it('correctly renders correct number of instance cards', () => {
    const wrapper = mount(<App />);
    const data = {
      Reservations: [
        {
          Instances: [
            {
              InstanceId: 'i-1234567890',
              State: {
                Name: 'stopped'
              },
              Tags: [
                {
                  Key: 'Name',
                  Value: 'TestServer'
                }
              ]
            }
          ]
        },
        {
          Instances: [
            {
              InstanceId: 'i-0987654321',
              State: {
                Name: 'running'
              },
              Tags: [
                {
                  Key: 'Project',
                  Value: 'TestProject'
                }
              ]
            }
          ]
        }
      ]
    };

    expect(wrapper.find('InstanceCard').exists()).toEqual(false);
    wrapper.instance().processInstanceData(data);
    wrapper.update();
    expect(wrapper.state('instances').length).toEqual(2);
    expect(wrapper.find('InstanceCard').exists()).toEqual(true);
  });
});
