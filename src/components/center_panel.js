const CenterPanel = (props) => {
  return <div className='d-flex flex-row'>
    <div className='p-4 rounded mx-auto' style={{ maxWidth: 500, backgroundColor: '#00000090'}}>
      {props.children}
    </div>
  </div>
}

export default CenterPanel;