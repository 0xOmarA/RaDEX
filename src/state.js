import { createContainer } from 'react-tracked';
import { useState } from 'react';

// The application obviously has some degree of global state in terms of the liquidity pools, the LP tokens that 
// govern the liquidity pools, etc... It would be unwise to have all of this information load multiple times on each
// transition between tabs. Something like this would create a very undesirable experience to users.
const useValue = () => useState({
  accountComponentAddress: undefined, // The component address of the account.

  liquidityPools: [], // An array of `LiquidityPool` objects.
  resourceInfoMapping: {} // An object which maps a resource address string to a resource object.
});
export const { Provider, useTracked } = createContainer(useValue, { concurrentMode: true });