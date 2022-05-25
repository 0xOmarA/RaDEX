const CenterPanel = ({children, className}) => {
  return <div className='d-flex flex-row'>
    <div className={`p-4 mx-auto ibm-sans center-panel ${className}`}>
      {children}
    </div>
  </div>
}

export default CenterPanel;