import styled from 'styled-components';
import { BsCaretDownFill } from 'react-icons/bs';
import { useEffect, useState } from 'react';

import { Dropdown } from 'react-bootstrap';
import { addressToAddressShorthand } from '../utils';

const StyledSwapInput = styled.input`
  /* Removing all of the default styling present on the input */
  background: none;
  background-color: none;
  color: white;
  outline: none;
  border: none;

  font-size: 25px;
`;

const StyledSwapInputDiv = styled.div`
  background-color: #2c363a;
  
  border-radius: 10px;
  width: 100%;
  padding: 15px;
`;

const SwapInput = ({resourceList, currentResource, currentAmount, onChange, className}) => {
  const [selectedResource, setSelectedResource] = useState(currentResource);
  const [amount, setAmount] = useState(currentAmount); // Will be a string due to large numbers

  useEffect(() => {
    setSelectedResource(currentResource);
  }, [currentResource]);
  
  useEffect(() => {
    setAmount(currentAmount);
  }, [currentAmount]);

  // Callback functions
  /// Sets the currently selected token.
  const handleOnSelect = resourceAddress => {
    let resource = resourceList[resourceAddress];
    setSelectedResource(resource);

    // Call the external onChange with the new state
    onChange(resource, amount);
  }

  /// Disables the scrolling from changing the values of the input field
  const handleOnWheel = (e) => {
    e.target.blur();
  };

  const handleOnChange = (e) => {
    setAmount(e.target.value);
    // Calling the external onChange with the new state
    onChange(selectedResource, e.target.value);
  }

  return <StyledSwapInputDiv 
    className={`ibm-mono d-flex flex-row align-items-center hover-glow ${className}`}
  >
    <StyledSwapInput 
      type='number'
      className = 'w-100'
      placeholder='0.0'
      onWheel={handleOnWheel}
      onChange={handleOnChange}
      value={amount}
    />
    <Dropdown
        onSelect={handleOnSelect}
      >
        <Dropdown.Toggle
          className='p-3 d-flex flex-row justify-content-center align-items-center fw-bold hover-glow outline-none'
          style={{borderRadius: 10, backgroundColor: '#101519', cursor: 'pointer'}}
        >
          {
            selectedResource === undefined ? 
              <p className='m-0 p-0 pe-2'>Select</p>
              : <div className='d-flex flex-row align-items-center justify-content-start'>
                <img src={selectedResource.icon_url} style={{width: 25, height: 25}} className='me-3'/>
                <p className='m-0 p-0'>{selectedResource.metadata.symbol}</p>
              </div>
          }
        </Dropdown.Toggle>

        <Dropdown.Menu 
          className='bg-dark'
          style={{color: 'white'}}>
          {
            Object.keys(resourceList).map((key) => {
              return <Dropdown.Item
                key={key}
                eventKey={key}
                className='bg-dark p-2 primary-outline border-hover'
                style={{color: 'white'}}
              >
                <div className='d-flex flex-row align-items-center justify-content-start'>
                  <img src={resourceList[key].icon_url} style={{width: 25, height: 25}} className='me-3'/>
                  <p className='m-0 p-0 me-3'>{addressToAddressShorthand(resourceList[key].resourceAddress, 5)}</p>
                  <p className='m-0 p-0'>{resourceList[key].metadata.name}</p>
                </div>
              </Dropdown.Item>
            })
          }
        </Dropdown.Menu>
      </Dropdown>
  </StyledSwapInputDiv>
}

export default SwapInput;