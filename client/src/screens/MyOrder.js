import React, { useEffect, useState } from "react";
import Navbar from "./../components/Navbar";
import Footer from "./../components/Footer";
// import "./MyOrderList.css"

const MyOrder = () => {
  const [orderData, setorderData] = useState({});

  const fetchMyOrder = async () => {
    console.log(localStorage.getItem("userEmail"));
    await fetch("https://gofood-ezlb.onrender.com/api/user/myOrder", {
      // credentials: 'include',
      // Origin:"http://localhost:3000/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: localStorage.getItem("userEmail"),
      }),
    }).then(async (res) => {
      let response = await res.json();
      await setorderData(response);
    });

    // await res.map((data)=>{
    //    console.log(data)
    // })
  };

  useEffect(() => {
    fetchMyOrder();
  }, []);

  return (
    <div>
      <div>
        <Navbar />
      </div>
      <div className="container">
        {orderData &&
          orderData.orderData &&
          orderData.orderData.order_data.map((dayData, index) => (
            <div key={index} className="row">
              {dayData[0].Order_date && (
                <div className="order-info col-12">
                  <div className="order-date text-white m-2">
                    {dayData[0].Order_date}
                  </div>
                  <hr className="divider" />
                </div>
              )}
              {dayData.map((arrayData, innerIndex) => (
                <div key={innerIndex} className="col-md-6 col-lg-3 col-sm-12">
                  {!arrayData.Order_date && (
                    <div className="item-container">
                      <div className="item-card">
                        <img
                          src={arrayData.img}
                          className="item-image"
                          alt="Item"
                        />
                        <div className="item-details">
                          <h5 className="item-name">{arrayData.name}</h5>
                          <hr className="divider" />
                          <div className="item-meta">
                            <span className="item-quantity">
                              {arrayData.qty}
                            </span>
                            <span className="item-size">{arrayData.size}</span>
                            <div className="item-price">
                              ₹{arrayData.price}/-
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
};

export default MyOrder;
