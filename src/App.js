import PoweredByRadix from './components/powered_by_radix';
import {Container, Navbar, Nav} from 'react-bootstrap';
import logo from './assets/images/radex-logo.svg';
import './App.css';

// React router imports
import { Routes, Route, NavLink } from "react-router-dom";

// Imports for the pages
import Liquidity from './pages/liquidity';
import Swap from './pages/swap';
import Error404 from './errors/404';
import Faucet from './pages/faucet';

// PTE SDK
import { getAccountAddress, signTransaction } from 'pte-browser-extension-sdk';

function App() {
  getAccountAddress().then((address) => {
    console.log("The addr is:", address);
  })
  return (
    <div className="background d-flex flex-column h-100">
      {/* The Nav Bar */}
      <Navbar variant="dark" className='pt-4'>
        <Container>
        <Navbar.Brand href="#home" className='ibm-sans'>
          <img src={logo} style={{width: 120}}/>
        </Navbar.Brand>
        <Nav className="ml-auto">
          <NavLink to="swap" className='ibm-sans pe-3 clickable-text'>Swap</NavLink> 
          <NavLink to="liquidity" className='ibm-sans pe-3 clickable-text'>Liquidity Provision</NavLink>
          <NavLink to="faucet" className='ibm-sans pe-3 clickable-text'>Faucet</NavLink>
          <a href="https://github.com/0xOmarA/radex" target="_blank" rel="noopener noreferrer" className='clickable-text'>Source Code</a>
        </Nav>
        </Container>
      </Navbar>
      
      {/* Main Page Body */}
      <Container className='my-auto'>
        <Routes>
          <Route path="/" element={<Swap />} />
          <Route path="swap" element={<Swap />} />
          <Route path="liquidity" element={<Liquidity />} />
          <Route path="faucet" element={<Faucet />} />
          
          <Route path="*" element={<Error404 />} />
        </Routes>
      </Container>

      {/* Page footer */}
      <div className='pb-5'>
        <PoweredByRadix/>
      </div>
    </div>
  );
}

export default App;
