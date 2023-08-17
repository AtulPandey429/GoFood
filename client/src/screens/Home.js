import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Card from './../components/Card';
import Caraosel from '../components/Caraosel';

const Home = () => {
  return (
    <div>
      <div><Navbar/></div>
      <div><Caraosel/></div>
      <div className='row m-5'>
        <div className="col"><Card/></div>
        <div className="col"><Card/></div>
        <div className="col"><Card/></div>
        <div className="col"><Card/></div>
        
        </div>
      <div className='container'><Footer/></div>
        
       
        
    </div>
  )
}

export default Home;