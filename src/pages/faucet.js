import { FAUCET_COMPONENT_ADDRESS } from '../constants';
import CenterPanel from '../components/center_panel';
import { Button } from 'react-bootstrap';

import { DefaultApi, ManifestBuilder } from 'pte-sdk';
import { getAccountAddress, signTransaction } from 'pte-browser-extension-sdk';

const Faucet = () => {
  return <CenterPanel>
    <h4 style={{fontWeight: 900}}>Faucet </h4>
    <p>Funds are important when you're playing around with a test network and a test-dApp, won't you agree? The RaDEX faucet gets you a few tokens to get up and running on the PTE so you can go out and test RaDEX or other dApps.</p>
    <div className='d-flex align-items-center justify-content-center'>
      <Button 
      className='ibm-mono' 
      onClick={handleButtonOnClick}
      style={{
        fontWeight: 900,
        borderRadius:  90,
        paddingInline: 20,
        textTransform: 'uppercase'
      }}
      >
        Request Funds
      </Button>
    </div>
  </CenterPanel>
}

const handleButtonOnClick = async () => {
  // Getting the address of the currently active account to deposit the tokens into
  const accountComponentAddress = await getAccountAddress();

  const manifest = new ManifestBuilder()
    .callMethod(FAUCET_COMPONENT_ADDRESS, "get_tokens", ['1000000i128'])
    .callMethodWithAllResources(accountComponentAddress,'deposit_batch')
    .build()
    .toString()
  
  let response = await signTransaction(manifest);
  console.log(response);
}

export default Faucet;