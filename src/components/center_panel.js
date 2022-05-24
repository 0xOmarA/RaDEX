const CenterPanel = (props) => {
  return <div className='d-flex flex-row'>
    <div className='p-4 mx-auto ibm-sans' style={{ maxWidth: 700, backgroundColor: '#00000090', borderRadius: '20px'}}>
      {props.children}
    </div>
  </div>
}

export default CenterPanel;