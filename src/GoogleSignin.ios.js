import React, { Component, PropTypes } from 'react';

import {
  View,
  NativeAppEventEmitter,
  NativeModules,
  requireNativeComponent,
} from 'react-native';

const { RNGoogleSignin } = NativeModules;

class GoogleSignin {

  constructor() {
    this._user = null;
    this.signinIsInProcess = false;
  }

  hasPlayServices(params = { autoResolve: true }) {
    return Promise.resolve(true);
  }

  configure(params={}) {
    if (!params.iosClientId) {
      throw new Error('GoogleSignin - Missing iOS app ClientID');
    }

    if (params.offlineAccess && !params.webClientId) {
      throw new Error('GoogleSignin - offline use requires server web ClientID');
    }

    params = [
	params.scopes || [], params.iosClientId, params.offlineAccess ? params.webClientId : '', params.hostedDomain ? params.hostedDomain : null
    ];

    RNGoogleSignin.configure(...params);
    return Promise.resolve(true);
  }

  currentUserAsync() {
    return new Promise((resolve, reject) => {
      const sucessCb = NativeAppEventEmitter.addListener('RNGoogleSignInSuccess', (user) => {
        this._user = user;
        this._removeListeners(sucessCb, errorCb);
        resolve(user);
      });

      const errorCb = NativeAppEventEmitter.addListener('RNGoogleSignInError', () => {
        this._removeListeners(sucessCb, errorCb);
        resolve(null);
      });

      RNGoogleSignin.currentUserAsync();
    });
  }

  currentUser() {
    return {...this._user};
  }

  signIn() {
    return new Promise((resolve, reject) => {
      const sucessCb = NativeAppEventEmitter.addListener('RNGoogleSignInSuccess', (user) => {
        this._user = user;
        this.signinIsInProcess = false;
        this._removeListeners(sucessCb, errorCb);
        resolve(user);
      });

      const errorCb = NativeAppEventEmitter.addListener('RNGoogleSignInError', (err) => {
        this._removeListeners(sucessCb, errorCb);
        this.signinIsInProcess = false;
        reject(err);
      });

      !this.signinIsInProcess && RNGoogleSignin.signIn();
    });
  }

  signOut() {
    return new Promise((resolve, reject) => {
      RNGoogleSignin.signOut();
      resolve();
    });
  }

  revokeAccess() {
    return new Promise((resolve, reject) => {
      const sucessCb = NativeAppEventEmitter.addListener('RNGoogleRevokeSuccess', () => {
        this._removeListeners(sucessCb, errorCb);
        resolve();
      });

      const errorCb = NativeAppEventEmitter.addListener('RNGoogleRevokeError', (err) => {
        this._removeListeners(sucessCb, errorCb);
        reject(err);
      });

      RNGoogleSignin.revokeAccess();
    });
  }

  _removeListeners(...listeners) {
    listeners.forEach(lt => lt.remove());
  }
}

const GoogleSigninSingleton = new GoogleSignin();

module.exports = {GoogleSignin: GoogleSigninSingleton};
