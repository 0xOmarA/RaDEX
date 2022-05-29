import styled from 'styled-components';
import { AiOutlineSwap } from 'react-icons/ai';
import { useState } from 'react';

const StyledSwapInOut = styled.div`
  width: 40px;
  height: 40px;
  
  border-radius: 5px;
  
  background-color: #2c363a;

  // Centering everything inside the div
  display: flex;
  align-items: center;
  justify-content: center;

  // Making it feel clickable
  cursor: pointer;

  // Adding some transitions for when the hovering happens
  -webkit-transition: all 0.15s;
  -moz-transition: all 0.15s;
  transition: all 0.15s;

  // Adding a border to the button
  border: 2px solid #0d6efd;

  // Remove any margins or padding
  margin: 0;
  padding: 0;
`;

const SwapInOut = ({className, style, onClick}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleOnMouseEnter = () => {setIsHovered(true)};
  const handleOnMouseLeave = () => {setIsHovered(false)};

  return <StyledSwapInOut 
    className={`hover-glow ${className}`} style={style}
    onMouseEnter={handleOnMouseEnter}
    onMouseLeave={handleOnMouseLeave}
    onClick={onClick}
  >
    <AiOutlineSwap
      style={{
        width: '25px',
        height: '25px',

        transition: 'all 0.15s ease-out',

        transform: isHovered ? 'rotate(270deg)' : 'rotate(90deg)'
      }}
    />
  </StyledSwapInOut>
}

export default SwapInOut;