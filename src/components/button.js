const Button = ({onClick, children, className}) => {
  return <div onClick={onClick} className={'btn btn-primary ibm-mono mx-auto'} style={{fontWeight: 900}}>
    {children}
  </div>
}

export default Button;