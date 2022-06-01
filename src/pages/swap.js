import CenterPanel from "../components/center_panel";

import { getAccountAddress, signTransaction } from 'pte-browser-extension-sdk';
import { ManifestBuilder } from 'pte-sdk';
import { useContext, useEffect, useState } from "react";

import { RADEX_COMPONENT_ADDRESS } from '../constants';
import SwapInput from "../components/swap_input";
import { Button } from "react-bootstrap";

import SwapInOut from "../components/swap_in_out";

import { AppContext } from "../App";

const Swap = () => {
  const state = useContext(AppContext);

  const [currentPool, setCurrentPool] = useState(undefined);
  
  const [amountIn, setAmountIn] = useState(undefined);
  const [resourceIn, setResourceIn] = useState(undefined);
  const [amountOut, setAmountOut] = useState(undefined);
  const [resourceOut, setResourceOut] = useState(undefined);

  const [validResourcesOutInfoMapping, setValidResourcesOutInfoMapping] = useState({});

  useEffect(() => {
    console.log("From Swap.js, the current state is", state);
  })


  const handleButtonOnClick = async (e) => {
    // Getting the address of the currently active account to deposit the tokens into
    const accountComponentAddress = await getAccountAddress();

    //  Building the swapping transaction
    const manifest = new ManifestBuilder()
      .callMethod(accountComponentAddress, 'withdraw_by_amount', [`Decimal("${amountIn}")`, `ResourceAddress("${resourceIn.resourceAddress}")`])
      .takeFromWorktop(resourceIn.resourceAddress, 'inputBucket')
      .callMethod(RADEX_COMPONENT_ADDRESS, "swap", [
        `Bucket("inputBucket")`,
        `ResourceAddress("${resourceOut.resourceAddress}")`
      ])
      .callMethodWithAllResources(accountComponentAddress, 'deposit_batch')
      .build()
      .toString();

    let response = await signTransaction(manifest);
    console.log(response);
  } 

  const handleSwapButtonOnClick = () => {
    let resource1 = resourceIn;
    let resource2 = resourceOut;

    setResourceIn(resource2);
    setResourceOut(resource1);
  }

  // This runs when the resource changes to find the resources which it can be exchanged for
  useEffect(() => {
    if (resourceIn !== undefined) {
      const resourceInAddress = resourceIn.resourceAddress;
  
      let validOutputResources = [];
      for (const poolInformation of state.liquidityPools) {
        let poolResources = Object.keys(poolInformation.amountsMapping);
        if (poolResources.includes(resourceInAddress)) {
          validOutputResources.push(...poolResources)
        }
      }
      console.log("valid resources are:", validOutputResources);
  
      let uniqueResourceAddresses = [...new Set(validOutputResources)]
        .filter((x) => x !== resourceInAddress);
        
      let validOutputResourcesMapping = {};
      for (const resourceAddress of uniqueResourceAddresses) {
        validOutputResourcesMapping[resourceAddress] = state.resourceInfoMapping[resourceAddress];
      }

      setValidResourcesOutInfoMapping(validOutputResourcesMapping);
      // setResourceOut(undefined);
      // setAmountOut(undefined);
    }
  }, [resourceIn]);

  // This runs whenever any of the resources change (whether input or output)
  useEffect(() => {
    // Ensure that all of the resources we depend upon are not undefined
    if (resourceIn !== undefined && resourceOut !== undefined) {
      // Getting the component address of the liquidity pool
      let currentPool = state.liquidityPools.filter((x) => {
        let poolResources = Object.keys(x.amountsMapping);
        return poolResources.includes(resourceIn.resourceAddress) && poolResources.includes(resourceOut.resourceAddress);
      })[0];

      if (currentPool !== undefined) {
        setCurrentPool(currentPool);
        let outputAmount = currentPool.calculateOutputAmount(resourceIn.resourceAddress, amountIn);
        setAmountOut(outputAmount);

        console.log("Liquidity pool was found to be:", currentPool);
      }
    }
  }, [resourceIn, resourceOut])

  return <CenterPanel className='w-100 position-relative'>
    <h4 style={{fontWeight: 900}}>Swap</h4>
    <p style={{fontSize: 12}}>Swap between fungible resources on the Radix public test environment</p>

    {/* The div with the two input fields */}
    <div className='w-100'>
      <SwapInput 
        resourceList={state.resourceInfoMapping || {}}
        currentResource={resourceIn}
        currentAmount={amountIn}
        onChange={(resource, amount) => {
          setResourceIn(resource);
          setAmountIn(amount);

          let outputAmount = currentPool.calculateOutputAmount(resource.resourceAddress, amount);
          if (outputAmount !== undefined) {
            setAmountOut(outputAmount);
          }
        }}
      />
      <SwapInput 
        className='mt-3'
        resourceList={validResourcesOutInfoMapping}
        currentResource={resourceOut}
        currentAmount={amountOut}
        onChange={(resource, amount) => {
          setResourceOut(resource);
          setAmountOut(amount);

          let inputAmount = currentPool.calculateInputAmount(resource.resourceAddress, amount);
          if (inputAmount !== undefined) {
            setAmountIn(inputAmount);
          }

          console.log(inputAmount);
          console.log(resource.resourceAddress);
          console.log(amount);
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
    disabled={[amountIn, amountOut, resourceIn, resourceOut].some((x) => x === undefined)}
    style={{
      fontWeight: 900,
      borderRadius:  90,
      paddingInline: 20,
    }}
    >
      Swap
    </Button>
  </CenterPanel>
}

export default Swap;