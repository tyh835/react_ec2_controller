import React, { Component } from 'react';
import AWS from 'aws-sdk';
import { Container, Message, Header, Button, Segment } from 'semantic-ui-react';

import { getStatusColour, getButtonColour } from './utils/colour.js';

AWS.config.update({
  region: process.env.REACT_APP_AWS_REGION,
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
  }
});

const ec2 = new AWS.EC2({
  region: process.env.REACT_APP_AWS_REGION,
  apiVersion: '2016-11-15'
});

const params = {
  InstanceIds: JSON.parse(process.env.REACT_APP_EC2_INSTANCE_IDS)
};

class App extends Component {
  state = {
    instanceState: 'pending',
    buttonState: 'Start Server',
    error: '',
    loading: true
  };

  handleDismiss = () => {
    this.setState(state => ({
      ...state,
      error: ''
    }));
  };

  handleClick = () => {
    switch (this.state.instanceState) {
      case 'running':
        return this.stopServer();
      case 'stopped':
        return this.startServer();
      default:
        return;
    }
  };

  checkStatus = async () => {
    try {
      // without params, this can describe all instances
      const response = await ec2.describeInstances(params).promise();
      const instanceState = response.Reservations[0].Instances[0].State.Name;
      console.log(response);

      switch (instanceState) {
        case 'stopped':
          return this.setState(state => ({
            ...state,
            instanceState,
            buttonState: 'Start Server',
            loading: false
          }));
        case 'running':
          return this.setState(state => ({
            ...state,
            instanceState,
            buttonState: 'Stop Server',
            loading: false
          }));
        default:
          return this.setState(state => ({
            ...state,
            instanceState,
            loading: true
          }));
      }
    } catch (err) {
      console.log(err, err.stack);
      return this.setState(state => ({
        ...state,
        error:
          'Failed to contact server. Check your environment and network connection',
        loading: false
      }));
    }
  };

  startServer = async () => {
    try {
      const response = await ec2.startInstances(params).promise();
      console.log(response);
      this.setState(state => ({
        ...state,
        instanceState: 'pending',
        loading: true
      }));
    } catch (err) {
      console.log(err, err.stack);
      return this.setState(state => ({
        ...state,
        error: err.message,
        loading: false
      }));
    }
  };

  stopServer = async () => {
    try {
      const response = await ec2.stopInstances(params).promise();
      console.log(response);
      this.setState(state => ({
        ...state,
        loading: true,
        instanceState: 'stopping'
      }));
    } catch (err) {
      console.log(err, err.stack);
      return this.setState(state => ({
        ...state,
        error: err.message,
        loading: false
      }));
    }
  };

  componentDidMount() {
    this.checkingStatus = setInterval(this.checkStatus, 1500);
  }

  componentWillUnmount() {
    clearInterval(this.checkingStatus);
  }

  render() {
    const { error, loading, instanceState, buttonState } = this.state;

    return (
      <>
        <Container>
          {error && (
            <Message
              header="Something went wrong,"
              content={error}
              negative
              onDismiss={this.handleDismiss}
            />
          )}
        </Container>
        <Container textAlign="center" className="main">
          <Segment padded="very" className="main__content">
            <Header as="h1">VPN Server Status</Header>
            <Header as="h2" color={getStatusColour(instanceState)}>
              {loading
                ? instanceState.toUpperCase() + '...'
                : instanceState.toUpperCase()}
            </Header>
            <Container className="main__button">
              <Button
                content={buttonState}
                color={getButtonColour(instanceState)}
                onClick={this.handleClick}
                loading={loading}
              />
            </Container>
          </Segment>
        </Container>
      </>
    );
  }
}

export default App;
