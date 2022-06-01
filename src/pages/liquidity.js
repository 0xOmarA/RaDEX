import CenterPanel from "../components/center_panel";

import { getAccountAddress, signTransaction } from 'pte-browser-extension-sdk';
import { DefaultApi, ManifestBuilder } from 'pte-sdk';
import { useEffect, useState, useContext } from "react";

import { RADEX_COMPONENT_ADDRESS } from '../constants';
import { addressStringToAddress } from "../utils";
import SwapInput from "../components/swap_input";
import Loading from '../components/loading';
import { Button } from "react-bootstrap";

import Resource from '../library/resource';
import LiquidityPool from '../library/liquidity_pool';

import SwapInOut from "../components/swap_in_out";

import { AppContext } from "../App";

const Swap = () => {
  const state = useContext(AppContext);

  const [pools, setPools] = useState([]);
  const [currentPool, setCurrentPool] = useState(undefined);
  
  const [resource1Amount, setResource1Amount] = useState(0);
  const [resource1, setResource1] = useState(undefined);
  const [resource2Amount, setResource2Amount] = useState(0);
  const [resource2, setResource2] = useState(undefined);

  const [validResourcesOutInfoMapping, setValidResourcesOutInfoMapping] = useState({});

  const handleButtonOnClick = async (e) => {
    // Getting the address of the currently active account to deposit the tokens into
    const accountComponentAddress = await getAccountAddress();
    
    //  Building the swapping transaction
    const manifest = new ManifestBuilder()
      .callMethod(accountComponentAddress, 'withdraw_by_amount', [`Decimal("${resource1Amount}")`, `ResourceAddress("${resource1.resourceAddress}")`])
      .callMethod(accountComponentAddress, 'withdraw_by_amount', [`Decimal("${resource2Amount}")`, `ResourceAddress("${resource2.resourceAddress}")`])
      .takeFromWorktop(resource1.resourceAddress, 'bucket1')
      .takeFromWorktop(resource2.resourceAddress, 'bucket2')
      .callMethod(RADEX_COMPONENT_ADDRESS, "add_liquidity", [`Bucket("bucket1")`, `Bucket("bucket2")`])
      .callMethodWithAllResources(accountComponentAddress, 'deposit_batch')
      .build()
      .toString();

    let response = await signTransaction(manifest);
    console.log(response);
  } 

  const handleSwapButtonOnClick = () => {
    let _resource1 = resource1;
    let _resource2 = resource2;

    setResource1(_resource2);
    setResource2(_resource1);
  }

  // Getting the available pools, their addresses, as well as the tokens that they hold
  const api = new DefaultApi();

  // This runs whenever any of the resources change (whether input or output)
  useEffect(() => {
    // Ensure that all of the resources we depend upon are not undefined
    if (resource1 !== undefined && resource2 !== undefined) {
      // Getting the component address of the liquidity pool
      let currentPool = state.liquidityPools.filter((x) => {
        let poolResources = Object.keys(x.amountsMapping);
        return poolResources.includes(resource1.resourceAddress) && poolResources.includes(resource1.resourceAddress);
      })[0];

      if (currentPool !== undefined) {
        console.log("The current LL liquidity pool is:", currentPool);
        setCurrentPool(currentPool);
        console.log('resource 1 address', resource1.resourceAddress)
        console.log('resource 1 amount', resource1Amount)
        let outputAmount = currentPool.calculateOutputLiquidityAmount(resource1.resourceAddress, resource1Amount);
        setResource2Amount(outputAmount);
      }
    }
  }, [resource1, resource2])

  return <CenterPanel className='w-100 position-relative'>
    <h4 style={{fontWeight: 900}}>Add Liquidity</h4>
    <p style={{fontSize: 12}}>Add or create new liquidity pools on the RaDEX platform</p>

    {/* The div with the two input fields */}
    <div className='w-100'>
      <SwapInput 
        resourceList={state.ownedResourceInfoMapping}
        currentResource={resource1}
        currentAmount={resource1Amount}
        onChange={(resource, amount) => {
          setResource1(resource);
          setResource1Amount(amount);

          let outputAmount = currentPool.calculateOutputLiquidityAmount(resource.resourceAddress, amount);
          if (outputAmount !== undefined) {
            setResource2Amount(outputAmount);
          }
        }}
      />
      <SwapInput 
        className='mt-3'
        resourceList={state.ownedResourceInfoMapping}
        currentResource={resource2}
        currentAmount={resource2Amount}
        onChange={(resource, amount) => {
          setResource2(resource);
          setResource2Amount(amount);

          let inputAmount = currentPool.calculateInputLiquidityAmount(resource.resourceAddress, amount);
          if (inputAmount !== undefined) {
            setResource1Amount(inputAmount);
          }
        }}
      />
      <SwapInOut
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-40%, -40%)',
        }}
        onClick={handleSwapButtonOnClick}
      />
    </div>
    <Button 
    className='ibm-mono mt-3 mx-auto w-100' 
    onClick={handleButtonOnClick}
    disabled={[resource1Amount, resource2Amount, resource1, resource2].some((x) => x === undefined)}
    style={{
      fontWeight: 900,
      borderRadius:  90,
      paddingInline: 20,
    }}
    >
      Add Liquidity
    </Button>
  </CenterPanel>
}

export default Swap;