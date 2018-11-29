import React, { Component } from 'react';
import AWS from 'aws-sdk';
import deepEqual from 'fast-deep-equal';

import InstanceCard from './InstanceCard.jsx';
import ErrorMessage from './ErrorMessage.jsx';

AWS.config.update({
  region: process.env.REACT_APP_AWS_REGION,
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
  }
});

const ec2 = new AWS.EC2({ apiVersion: '2016-11-15'});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      instances: [],
      error: ''
    };

    this.handleDismiss = this.handleDismiss.bind(this);
    this.changeServerState = this.changeServerState.bind(this);
    this.checkStatus = this.checkStatus.bind(this);
    this.startServer = this.startServer.bind(this);
    this.stopServer = this.stopServer.bind(this);
  }

  handleDismiss() {
    this.setState(state => ({
      ...state,
      error: ''
    }));
  }

  changeServerState(e) {
    const instanceId = e.target.id;
    const buttonState = e.target.innerText;
    switch (buttonState) {
      case 'Start Server':
        return this.startServer(instanceId);
      case 'Stop Server':
        return this.stopServer(instanceId);
      default:
        return;
    }
  }

  async checkStatus() {
    try {
      const response = await ec2.describeInstances().promise();
      console.log(response);
      const instances = response.Reservations.reduce(
        (instances, reservation) => {
          return [...instances, ...reservation.Instances];
        },
        []
      ).map(instance => {
        const instanceState = instance.State.Name;
        switch (instanceState) {
          case 'stopped':
            return {
              id: instance.InstanceId,
              instanceTags: instance.Tags,
              instanceState,
              buttonState: 'Start Server',
              loading: false
            };
          case 'running':
            return {
              id: instance.InstanceId,
              instanceTags: instance.Tags,
              instanceState,
              buttonState: 'Stop Server',
              loading: false
            };
          case 'terminated':
            return {
              id: instance.InstanceId,
              instanceTags: instance.Tags,
              instanceState,
              buttonState: 'Terminated',
              loading: false
            };
          default:
            return {
              id: instance.InstanceId,
              instanceTags: instance.Tags,
              instanceState,
              buttonState: 'Transition',
              loading: true
            };
        }
      });

      if (!deepEqual(instances, this.state.instances)) {
        this.setState(state => ({
          ...state,
          instances: instances
        }));
      }
    } catch (err) {
      console.log(err, err.stack);
      this.setState(state => ({
        ...state,
        error:
          'Failed to contact server. Check your config and network connection',
        loading: false
      }));
    }
  }

  async startServer(id) {
    const params = {
      InstanceIds: [id]
    };
    try {
      const response = await ec2.startInstances(params).promise();
      console.log(response);
      this.setState(state => {
        const instances = state.instances.map(instance => {
          return instance.id !== id
            ? instance
            : {
                ...instance,
                instanceState: 'pending',
                loading: true
              };
        });
        return {
          ...state,
          instances
        };
      });
    } catch (err) {
      console.log(err, err.stack);
      this.setState(state => ({
        ...state,
        error: err.message
      }));
    }
  }

  async stopServer(id) {
    const params = {
      InstanceIds: [id]
    };
    try {
      const response = await ec2.stopInstances(params).promise();
      console.log(response);
      this.setState(state => {
        const instances = state.instances.map(instance => {
          return instance.id !== id
            ? instance
            : {
                ...instance,
                instanceState: 'stopping',
                loading: true
              };
        });
        return {
          ...state,
          instances
        };
      });
    } catch (err) {
      console.log(err, err.stack);
      this.setState(state => ({
        ...state,
        error: err.message
      }));
    }
  }

  componentDidMount() {
    this.checkingStatus = setInterval(this.checkStatus, 2000);
  }

  componentWillUnmount() {
    clearInterval(this.checkingStatus);
  }

  render() {
    const { error, instances } = this.state;
    return (
      <>
        <ErrorMessage error={error} handleDismiss={this.handleDismiss} />
        {instances.map(instance => (
          <InstanceCard
            instance={instance}
            handleButtonClick={this.changeServerState}
          />
        ))}
      </>
    );
  }
}

export default App;
