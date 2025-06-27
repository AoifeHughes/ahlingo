/**
 * AHLingo Mobile App
 * React Native Language Learning Application
 */

import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {Provider} from 'react-redux';
import {store} from './src/store';
import {AppNavigator} from './src/navigation/AppNavigator';
import {ThemeProvider} from './src/components/ThemeProvider';

function App(): JSX.Element {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <NavigationContainer>
          <StatusBar 
            barStyle="light-content" 
            backgroundColor="#1976D2" 
            translucent={false}
          />
          <AppNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </Provider>
  );
}

export default App;