import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import SignIn from '../components/signin';
import SignUp from '../components/signup';
import NavBar from '../components/navbar';
import OnBoard from '../components/OnBoard';
import OnBoardSuccess from '../components/OnBoardSuccess';

class Routes extends Component {
  render() {
    return (
      <div>
        <Route path="/" component={NavBar} />
        <Route path="/signin" component={SignIn} exact />
        <Route path="/signup" component={SignUp} exact />
        <Route path="/onboard" exact component={OnBoard} />
        <Route path="/onboard/success" exact component={OnBoardSuccess} />
      </div>
    );
  }
}

export default Routes;
