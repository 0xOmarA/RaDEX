import PoweredByRadix from './components/powered_by_radix';
import {Container, Navbar, Nav} from 'react-bootstrap';
import './App.css';

// React router imports
import { Routes, Route, Link } from "react-router-dom";

// Imports for the pages
import Liquidity from './pages/liquidity';
import Swap from './pages/swap';
import Error404 from './errors/404';

function App() {
  return (
    <div className="background d-flex flex-column h-100">
      {/* The Nav Bar */}
      <Navbar variant="dark">
        <Container>
        <Navbar.Brand href="#home" className='ibm-sans'>RaDEX</Navbar.Brand>
        <Nav className="ml-auto">
          <Link to="swap" className='ibm-sans pe-3'>Swap</Link> 
          <Link to="liquidity" className='ibm-sans pe-3'>Liquidity Provision</Link>
          <a href="https://github.com/0xOmarA/radex" target="_blank" rel="noopener noreferrer">Source Code</a>
        </Nav>
        </Container>
      </Navbar>
      
      {/* Main Page Body */}
      <Container>
        <Routes>
          <Route path="/" element={<Swap />} />
          <Route path="swap" element={<Swap />} />
          <Route path="liquidity" element={<Liquidity />} />
          
          <Route path="*" element={<Error404 />} />
        </Routes>
      </Container>

      {/* Page footer */}
      <div className='py-5 mt-auto'>
        <PoweredByRadix/>
      </div>
    </div>
  );
}

export default App;
