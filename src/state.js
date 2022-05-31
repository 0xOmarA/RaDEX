import { getAccountAddress } from 'pte-browser-extension-sdk';
import { DefaultApi } from 'pte-sdk';

import { createContainer } from 'react-tracked';
import { useState } from 'react';

import LiquidityPool from './library/liquidity_pool';
import Resource from './library/resource';

import { RADEX_COMPONENT_ADDRESS } from './constants';
import { addressStringToAddress } from './utils';

// The application obviously has some degree of global state in terms of the liquidity pools, the LP tokens that 
// govern the liquidity pools, etc... It would be unwise to have all of this information load multiple times on each
// transition between tabs. Something like this would create a very undesirable experience to users.
const useValue = () => useState({
  accountComponentAddress: undefined, // The component address of the account.

  liquidityPools: [], // An array of `LiquidityPool` objects.
  resourceInfoMapping: {} // An object which maps a resource address string to a resource object.
});
export const { Provider, useTracked } = createContainer(useValue, { concurrentMode: true });

// We need to have functions and methods to get the state when the user enters the site and also periodically every 
// now and then. 
export const updateState = async () => {
  // This is the API object that will be used by this function
  const api = new DefaultApi();

  // Getting the account component's address
  queueMicrotask(async () => {
    console.log("Attempting to obtain address");
    let address = await getAccountAddress();
    console.log("Address is:", address);
  });

  // Query the RaDEX component for the liquidity pools that it has
  const radexComponentInformation = await api.getComponent({address: RADEX_COMPONENT_ADDRESS});
  const radexComponentState = JSON.parse(radexComponentInformation['state']);
  console.debug("Radex component state is:", radexComponentState);

  // Parsing out the radexComponentState to get the useful information from there. 
  
  // This is a list which stores the liquidity pool information in an object of the format: 
  // {
  //   resourceAddresses: 'list[str]',
  //   componentAddress: 'str',
  // }
  const liquidityPoolInformation = (({ componentState }) => {
    let componentAddressHashMap = componentState.fields[0].elements;
    let lpTokenHashMap = componentState.fields[1].elements;

    let componentAddressKeys = componentAddressHashMap.filter(item => item.type === 'Tuple');
    let componentAddressValues = componentAddressHashMap.filter(item => item.type === 'Struct');

    let componentAddressParsedResponse = componentAddressKeys.map(function(element, i) {
      let addresses = [element.elements[0].value, element.elements[1].value, componentAddressValues[i].fields[0].value].map(addressStringToAddress)
      
      return {
        resourceAddresses: [addresses[0], addresses[1]],
        componentAddress: addresses[2]
      };
    })

    let lpTokenKeys = lpTokenHashMap.filter(item => item.type === 'Tuple');
    let lpTokenValues = lpTokenHashMap.filter(item => item.type === 'ResourceAddress');

    let lpTokenParsedResponse = lpTokenKeys.map(function(element, i) {
      let addresses = [element.elements[0].value, element.elements[1].value, lpTokenValues[i].value].map(addressStringToAddress)
      
      return {
        resourceAddresses: [addresses[0], addresses[1]],
        lpTokenResourceAddress: addresses[2]
      };
    })

    // Converting the LP token parsed response to an array that can be easily interpreted by the code
    let lpTokenParsedObject = {}
    for (const element of lpTokenParsedResponse) {
      lpTokenParsedObject[element.resourceAddresses] = element.lpTokenResourceAddress;
      lpTokenParsedObject[element.resourceAddresses.reverse()] = element.lpTokenResourceAddress;
    }

    // Finally, adding the LP token to the liquidity pool information
    

    console.log(lpTokenParsedObject);
    console.log(componentAddressParsedResponse)

    return componentAddressParsedResponse
  })({componentState: radexComponentState})
  console.log(liquidityPoolInformation);
}
