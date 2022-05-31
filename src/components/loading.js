const Loading = ({isLoading}) => {
  return <div 
    className='position-absolute w-100 h-100 justify-content-center align-items-center'
    style={{
      top:0, 
      left:0, 
      zIndex: 2, 
      backgroundColor: "#000000D0", 
      display: isLoading ? 'flex' : 'none',
      borderRadius: 'inherit'
    }}
  >
    <div className='loader'></div>
  </div>
}

export default Loading;