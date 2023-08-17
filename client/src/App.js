// import { Route, Router, Routes } from "react-router-dom";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import "./App.css";

import Home from "./screens/Home";
import Login from "./screens/Login";
import'../node_modules/bootstrap-dark-5/dist/css/bootstrap-dark.min.css'
import'../node_modules/bootstrap/dist/js/bootstrap.bundle'
import'../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'

function App() {
  return (
    <>
    <Router>
      <div className="App">
        <Routes>
          <Route exact path="/" element={<Home />} />
        </Routes>
        <Routes>
          <Route exact path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
    </>
  );
}

export default App;
