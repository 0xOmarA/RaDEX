import PoweredByRadix from './components/powered_by_radix';
import { Container, Navbar, Nav } from 'react-bootstrap';
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
import { getAccountAddress } from 'pte-browser-extension-sdk';
import { DefaultApi } from 'pte-sdk';
import AccountBar from './components/account_bar';

// Icon imports
import { FaExchangeAlt, FaFaucet, FaGithub } from 'react-icons/fa';
import { BsDropletHalf } from 'react-icons/bs';
import { RiErrorWarningLine } from 'react-icons/ri';

import { createContext, useEffect, useState } from 'react';
import Loading from './components/loading'

import LiquidityPool from './library/liquidity_pool';
import Resource from './library/resource';

import { RADEX_COMPONENT_ADDRESS } from './constants';
import { addressStringToAddress } from './utils';

export const AppContext = createContext(null);

function App() {
  // The application global state
  const [state, setState] = useState({
    accountComponentAddress: undefined,

    liquidityPools: [],
    resourceInfoMapping: {},
    ownedResourceInfoMapping: {},
  });

  // Determine the currently active page from the location
  const location = useLocation()
  const path_name = location.pathname.split('/')[1];

  // The state which tells us whether the app is loading or not
  const [isLoading, setIsLoading] = useState(false);

  // We need to have functions and methods to get the state when the user enters the site and also periodically every 
  // now and then. 
  const updateState = async () => {
    // This is the API object that will be used by this function
    const api = new DefaultApi();

    // Query the RaDEX component for the liquidity pools that it has
    const radexComponentInformation = await api.getComponent({ address: RADEX_COMPONENT_ADDRESS });
    const radexComponentState = JSON.parse(radexComponentInformation['state']);
    console.debug("Radex component state is:", radexComponentState);

    // Parsing out the radexComponentState to get the useful information from there. 
    const liquidityPoolInformation = (({ componentState }) => {
      let componentAddressHashMap = componentState.fields[0].elements;
      let lpTokenHashMap = componentState.fields[1].elements;

      let componentAddressKeys = componentAddressHashMap.filter(item => item.type === 'Tuple');
      let componentAddressValues = componentAddressHashMap.filter(item => item.type === 'Struct');

      let componentAddressParsedResponse = componentAddressKeys.map(function (element, i) {
        let addresses = [element.elements[0].value, element.elements[1].value, componentAddressValues[i].fields[0].value].map(addressStringToAddress)

        return {
          resourceAddresses: [addresses[0], addresses[1]],
          componentAddress: addresses[2]
        };
      })

      let lpTokenKeys = lpTokenHashMap.filter(item => item.type === 'Tuple');
      let lpTokenValues = lpTokenHashMap.filter(item => item.type === 'ResourceAddress');

      let lpTokenParsedResponse = lpTokenKeys.map(function (element, i) {
        let addresses = [element.elements[0].value, element.elements[1].value, lpTokenValues[i].value].map(addressStringToAddress)

        return {
          resourceAddresses: [addresses[0], addresses[1]],
          lpTokenResourceAddress: addresses[2]
        };
      })

      // Converting the LP token parsed response to an array that can be easily interpreted by the code
      let lpTokenParsedObject = {}
      for (const element of lpTokenParsedResponse) {
        lpTokenParsedObject[element.resourceAddresses] = element.lpTokenResourceAddress;
        lpTokenParsedObject[element.resourceAddresses.reverse()] = element.lpTokenResourceAddress;
      }

      // Finally, adding the LP token to the liquidity pool information
      // This is a list which stores the liquidity pool information in an object of the format: 
      // {
      //   resourceAddresses: 'list[str]',
      //   componentAddress: 'str',
      //   trackerResourceAddress: 'str',
      // }
      componentAddressParsedResponse = componentAddressParsedResponse.map((item) => {
        item['trackerResourceAddress'] = lpTokenParsedObject[item['resourceAddresses']]
        return item
      })

      return componentAddressParsedResponse;
    })({ componentState: radexComponentState })
    console.debug("LiquidityPools are:", liquidityPoolInformation);

    // Converting the liquidityPoolInformation into an array of liquidity pools that has all of the information needed on
    // the liquidity pools.
    Promise.all(
      liquidityPoolInformation.map(async (item) => {
        // Query the API for the component state
        let response = await api.getComponent({ address: item.componentAddress });

        let balances = response.ownedResources
          .filter((x) => x.amount !== '1');

        return new LiquidityPool(
          item.componentAddress,

          balances[0].resourceAddress,
          balances[1].resourceAddress,

          balances[0].amount,
          balances[1].amount,

          item.trackerResourceAddress,
        );
      })
    ).then(results => {
      console.log("Setting the liquidity pool state to be:", results)
      setState((s) => ({
        ...s,
        liquidityPools: results
      }))
    })

    // Getting the resource addresses of all of the resources in the liquidity pools to create the resource
    // info mapping.
    let resourceAddresses = liquidityPoolInformation
      .map((x) => x.resourceAddresses)
      .flat();
    let uniqueResourceAddresses = [...new Set(resourceAddresses)];
    Promise.all(
      uniqueResourceAddresses.map(async (resourceAddress) => {
        return await Resource.fromResourceAddress(resourceAddress);
      })
    ).then((results) => {
      // Creating a simple mapping from the resources
      let mapping = {}
      for (const resource of results) {
        mapping[resource.resourceAddress] = resource;
      }

      setState((s) => ({
        ...s,
        resourceInfoMapping: mapping
      }))
    })

    // Getting the resource available in the account component
    let address = await getAccountAddress();
    setState((s) => ({
      ...s,
      accountComponentAddress: address
    }));
    api.getComponent({ address: address }).then((response) => {
      console.log("response about account is", response);
      let ownedResourceAddresses = response.ownedResources.map(x => x.resourceAddress);
      Promise.all(
        ownedResourceAddresses.map(async (resourceAddress) => {
          return Resource.fromResourceAddress(resourceAddress);
        })
      ).then((results) => {
        // Creating a simple mapping from the resources
        let mapping = {}
        for (const resource of results) {
          mapping[resource.resourceAddress] = resource;
        }

        setState((s) => ({
          ...s,
          ownedResourceInfoMapping: mapping
        }))
      })
    })
    // let accountResources = (await api.getComponent({address: address}))['owned_resources'].map((x) => x.resource_address);
    // console.log(accountResources);
  }

  // This method will execute one the component has mounted
  useEffect(() => {
    setIsLoading(true);
    updateState().then(() => setIsLoading(false))
  }, [])

  return (
    <AppContext.Provider value={state}>
      <div className="background d-flex flex-column h-100 ibm-sans">
        <div 
          className='d-flex d-lg-none' 
          style={{backgroundColor: '#000000D0', width: '100vw', height: '100vh'}}
        >
          <Container className='d-flex flex-column justify-content-center align-items-center'>
            <RiErrorWarningLine size={64}/>
            <h2 className='mt-2'>RaDEX is only available on PC browsers</h2>
            <p>At the current moment of time, RaDEX is not available for smartphone browsers. If you wish to try RaDEX out, please switch to your personal computer, install the PTE wallet, and give RaDEX a try.</p>
          </Container>
        </div>
        <Loading isLoading={isLoading} />
        {/* The Nav Bar */}
        <Navbar variant="dark" className='pt-4'>
          <Container>
            <Navbar.Brand href="/">
              <img src={logo} style={{ width: 120 }} />
            </Navbar.Brand>
            <Nav
              className="px-2 py-2"
              style={{ borderRadius: 25, backgroundColor: '#00000080' }}
            >
              <NavLink
                to="swap"
                className={`ibm-sans me-1 clickable-text ${path_name === "swap" || path_name === "" ? "active-clickable-text" : ""}`}
              >
                <FaExchangeAlt className='me-2' /> Swap
              </NavLink>
              <NavLink
                to="liquidity"
                className={`ibm-sans me-1 clickable-text ${path_name === "liquidity" ? "active-clickable-text" : ""}`}
              >
                <BsDropletHalf className='me-2' /> Liquidity
              </NavLink>
              <NavLink
                to="faucet"
                className={`ibm-sans me-1 clickable-text ${path_name === "faucet" ? "active-clickable-text" : ""}`}
              >
                <FaFaucet className='me-2' /> Faucet
              </NavLink>
              <a
                href="https://github.com/0xOmarA/radex"
                target="_blank"
                rel="noopener noreferrer"
                className='clickable-text'
              >
                <FaGithub className='me-2' /> Source Code
              </a>
            </Nav>
            <Nav>
              <AccountBar address={state.accountComponentAddress} />
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
          <PoweredByRadix />
        </div>
      </div>
    </AppContext.Provider>
  );
}

export default App;
