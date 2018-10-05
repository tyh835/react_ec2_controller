import React, { Component } from 'react';
import { Container, Message, Header, Button, Segment } from 'semantic-ui-react';
import AWS from 'aws-sdk';

AWS.config.update({region: 'us-west-2', credentials: {
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_KEY
}});

const ec2 = new AWS.EC2({region: 'us-west-2', apiVersion: '2016-11-15'});

const params = {
  InstanceIds: [process.env.REACT_APP_EC2_INSTANCE_ID],
};


class App extends Component {
  state = {
    instanceState: 'checking...',
    buttonState: 'Start Server',
    error: '',
    loading: false
  }

  handleDismiss = () => {
    this.setState(state => ({
      ...state,
      error: ''
    }))
  }

  checkStatus = async () => {
    try {
      const response = await ec2.describeInstanceStatus(params).promise();
      if (response.InstanceStatuses.length === 0) {
        return this.setState(state => ({
          ...state,
          instanceState: 'stopped',
          buttonState: 'Start Server'
        }));
      }

      const instanceState = response.InstanceStatuses[0].InstanceState.Name;

      if (instanceState === 'running') {
        this.setState(state => ({
          ...state,
          instanceState,
          buttonState: 'Stop Server',
          loading: false
        }));
      } else {
        this.setState(state => ({
          ...state,
          instanceState,
        }));
      }
    } catch (err) {
      console.log(err, err.stack);
      return this.setState(state => ({
        ...state,
        error: 'No server or network connection detected'
      }));
    }
  }

  serviceController = () => {
    switch (this.state.instanceState) {
      case 'running':
        return this.stopServer();
      case 'stopped':
        return this.startServer();
      default:
        return;
    }
  }

  startServer = async () => {
    try {
      await this.setState(state => ({
        ...state,
        loading: true
      }));
      const response = await ec2.startInstances(params).promise();
      console.log(response);
    } catch (err) {
      return this.setState(state => ({
        ...state,
        error: err.message,
        loading: false
      }));
    }
  }

  stopServer = async () => {
    try {
      clearInterval(this.checkingStatus)
      await this.setState(state => ({
        ...state,
        loading: true,
        instanceState: 'Stopping...'
      }));
      const response = await ec2.stopInstances(params).promise();
      await setTimeout(() => {
        this.setState(state => ({
        ...state,
        loading: false
        }));
        this.beginStatusChecks();
      }, 4000)
      console.log(response);
    } catch (err) {
      console.log(err, err.stack);
      return this.setState(state => ({
        ...state,
        error: err.message,
        loading: false
      }));
    }
  }

  beginStatusChecks = () => {
    this.checkStatus();
    this.checkingStatus = setInterval(this.checkStatus, 1500);
  }

  componentDidMount() {
    this.beginStatusChecks();
  }

  componentWillUnmount() {
    this.stopServer();
    clearInterval(this.checkingStatus);
  }

  getHeadingColour = () => {
    switch (this.state.instanceState) {
      case 'running':
        return 'green';
      case 'stopped':
        return 'red';
      default:
        return 'yellow';
    }
  }

  getButtonColour = () => {
    switch (this.state.buttonState) {
      case 'Start Server':
        return 'green';
      case 'Stop Server':
        return 'orange';
      default:
        return 'green';
    }
  }

  render() {
    const {error, loading, instanceState, buttonState} = this.state;
    return (
      <>
      <Container>
      {error && <Message header='Something went wrong,' content={error} negative onDismiss={this.handleDismiss}/>}
      </Container>
      <Container textAlign='center' className="main">
        <Segment padded="very" className="main__content">
          <Header as='h1'>VPN Server Status</Header>
          <Header as='h2' color={this.getHeadingColour()}>{instanceState.toUpperCase()}</Header>
          <Container className="main__button">
            <Button content={buttonState} color={this.getButtonColour()} onClick={this.serviceController} loading={loading} />
          </Container>
        </Segment>
      </Container>
      </>
    );
  }
}

export default App;
