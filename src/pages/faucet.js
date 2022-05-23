import { FAUCET_COMPONENT_ADDRESS } from '../constants';
import CenterPanel from '../components/center_panel';
import Button from '../components/button';

const Faucet = () => {
  return <CenterPanel>
    <h4 className='ibm-mono' style={{fontWeight: 900}}>Faucet</h4>
    <p className='ibm-mono'>The RaDEX faucet allows you to get some funds into your PTE wallet to get up an running quickly to test the application that you're currently trying out.</p>
    <Button>Hello</Button>
  </CenterPanel>
  
  
}

export default Faucet;