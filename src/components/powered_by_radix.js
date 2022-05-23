import radixLogo from '../assets/images/radix-logo.svg';

const PoweredByRadix = () => {
  return <div 
    className='ibm-mono text-uppercase d-flex flex-row justify-content-center align-items-center' 
    style={{fontSize: 12, letterSpacing: 4, cursor: 'pointer'}}
    onClick={handleOnClick}
  >
    <p className='my-auto'>Powered By</p>
    <img src={radixLogo} style={{width: "90px", marginLeft: 10}}/>
  </div>
}

const handleOnClick = () => {
  window.open('https://developers.radixdlt.com/', '_blank');
}

export default PoweredByRadix;