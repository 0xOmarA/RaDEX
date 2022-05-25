import { getAccountAddress } from 'pte-browser-extension-sdk';
import FancyClickable from './fancy_clicable';
import { useEffect, useState } from 'react';

import { addressToAddressShorthand } from '../utils';

// Defines how many characters from the beginning and end are used for the shortened version of the address.
const SHORTENED_COUNT = 5;

const AccountBar = ({address}) => {
  // Checking if the account address is defined or not to determine what will be rendered to the screen
  let isAccountDefined = address !== undefined;

  if (isAccountDefined) {
    // If the account is defined, then we wish to get a shorter version of the address to use for the preview. The 
    // shorter version will be (first x letters ... last x letters).
    let shortened_address = addressToAddressShorthand(address, SHORTENED_COUNT);

    return <FancyClickable>
      <div className='d-flex flex-row justify-content-center align-items-center'>
        <img 
          src={`https://api.kwelo.com/v1/media/identicon/${address}`} 
          style={{borderRadius: 900, maxHeight: 20, marginRight: 10}}
        />
        {shortened_address}
      </div>
    </FancyClickable>
  } else {
    return <FancyClickable>
      No Account Detected
    </FancyClickable>
  }
}

export default AccountBar;