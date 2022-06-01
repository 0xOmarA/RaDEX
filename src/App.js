import PoweredByRadix from './components/powered_by_radix';
import {Container, Navbar, Nav} from 'react-bootstrap';
import logo from './assets/images/radex-logo.svg';
import './App.css';

// React router imports
import { Routes, Route, NavLink, useLocation } from "react-router-dom";

// Imports for the pages
import Error404 from './errors/404';
import Liquidity from './pages/liquidity';
import Faucet from './pages/faucet';
import Swap from './pages/swap';

// PTE SDK
import { getAccountAddress, signTransaction } from 'pte-browser-extension-sdk';
import AccountBar from './components/account_bar';

// Icon imports
import { FaExchangeAlt, FaFaucet, FaGithub } from 'react-icons/fa';
import { BsDropletHalf } from 'react-icons/bs';
import { useEffect, useState } from 'react';

function App() {
  // Determine the currently active page from the location
  const location = useLocation()
  const path_name = location.pathname.split('/')[1];

  // State variable used for the account address
  const [accountAddress, setAccountAddress] = useState(undefined);

  // Getting the account address as soon as everything is loaded up
  // useEffect(() => {
  //   setTimeout(async () => {
  //     console.log("Attempting to get the account address")
  //     getAccountAddress().then((address) => {
  //       setAccountAddress(address)
  //     }).catch((e) => {
  //       console.log("An error happened while attempting to get the address");
  //     });
  //   }, Math.round(Math.random() * 12000))
  // }, [])

  return (
    <div className="background d-flex flex-column h-100">
      {/* The Nav Bar */}
      <Navbar variant="dark" className='pt-4'>
        <Container>
        <Navbar.Brand href="/">
          <img src={logo} style={{width: 120}}/>
        </Navbar.Brand>
        <Nav 
          className="px-2 py-2"
          style={{borderRadius: 25, backgroundColor: '#00000080'}}
        >
          <NavLink 
            to="swap" 
            className={`ibm-sans me-1 clickable-text ${path_name === "swap" || path_name === "" ? "active-clickable-text" : ""}`}
          > 
            <FaExchangeAlt className='me-2'/> Swap
          </NavLink> 
          <NavLink 
            to="liquidity" 
            className={`ibm-sans me-1 clickable-text ${path_name === "liquidity" ? "active-clickable-text" : ""}`}
          > 
            <BsDropletHalf className='me-2'/> Liquidity
          </NavLink> 
          <NavLink 
            to="faucet" 
            className={`ibm-sans me-1 clickable-text ${path_name === "faucet" ? "active-clickable-text" : ""}`}
          > 
            <FaFaucet className='me-2'/> Faucet
          </NavLink> 
          <a 
            href="https://github.com/0xOmarA/radex" 
            target="_blank" 
            rel="noopener noreferrer" 
            className='clickable-text'
          >
            <FaGithub className='me-2'/> Source Code
          </a>
        </Nav>
        <Nav>
          <AccountBar address={accountAddress}/>
        </Nav>
        </Container>
      </Navbar>
      
      {/* Main Page Body */}
      <Container className='my-auto'>
        <Routes>
          <Route path="/" element={<Swap />}/>
          
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
