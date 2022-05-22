import radixLogo from '../assets/radix-logo.svg';

const PoweredByRadix = () => {
  return <div 
    className='ibm-mono text-uppercase d-flex flex-row justify-content-center align-items-center' 
    style={{fontSize: 12, letterSpacing: 4, cursor: 'pointer'}}
    onClick={handleOnClick}
  >
    <p className='my-auto'>Powered By</p>
    <img className='mx-2' src={radixLogo} style={{width: "100px"}}/>
  </div>
}

const handleOnClick = () => {
  window.open('https://developers.radixdlt.com/', '_blank');
}

export default PoweredByRadix;