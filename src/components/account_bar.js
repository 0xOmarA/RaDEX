import { getAccountAddress } from 'pte-browser-extension-sdk';
import FancyClickable from './fancy_clicable';
import { useEffect, useState } from 'react';

// Defines how many characters from the beginning and end are used for the shortened version of the address.
const SHORTENED_COUNT = 5;

const AccountBar = () => {
  // The state used for the user account and its setter
  const [account_address, setAccountAddress] = useState(undefined);

  // Attempting to get the current account component address ONLY when everything has mounted and we can confidently 
  // attempt to obtain the address.
  useEffect(() => {
    getAccountAddress().then((address) => {
      setAccountAddress(address)
    });
  })

  // Checking if the account address is defined or not to determine what will be rendered to the screen
  let isAccountDefined = account_address !== undefined;

  if (isAccountDefined) {
    // If the account is defined, then we wish to get a shorter version of the address to use for the preview. The 
    // shorter version will be (first x letters ... last x letters).
    let shortened_address = account_address.slice(0, SHORTENED_COUNT) + '..' + account_address.slice(account_address.length - SHORTENED_COUNT, account_address.length);

    return <FancyClickable>
      <div className='d-flex flex-row justify-content-center align-items-center'>
        <img 
          src={`https://api.kwelo.com/v1/media/identicon/${account_address}`} 
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