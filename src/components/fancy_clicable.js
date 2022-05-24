const FancyClickable = ({children, className, onClick}) => {
  return <div 
    className={`fancy-clickable px-3 py-2 ibm-mono ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
}

export default FancyClickable;