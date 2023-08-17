import React from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <div>
     <nav className="navbar navbar-expand-lg text-danger fs-2  bg-success" >
  <div className="container-fluid">
    <Link className="navbar-brand fs-1 text-white    font-size-bold" to="/">GoFood</Link>
   
    <div className="collapse navbar-collapse" id="navbarNav">
      <ul className="navbar-nav ">
        <li className="nav-item">
          <Link className="nav-link active text-white" aria-current="page" to="#">Home</Link>
        </li>
       
        <li className="nav-item">
          <Link className="nav-link" to="/login">Login</Link>
        </li>
       
      </ul>
    </div>
  </div>
</nav>
    </div>
  )
}

export default Navbar